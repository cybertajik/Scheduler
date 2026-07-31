import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { holidayService } from '../services/apiServices';

export interface HolidayEvent {
  date: string;      // YYYY-MM-DD
  name: string;
  country: string;   // ISO2
}

interface HolidayContextType {
  holidays: HolidayEvent[];
  loading: boolean;
  getHolidaysForDate: (dateStr: string) => HolidayEvent[];
  isHoliday: (dateStr: string) => boolean;
  refreshHolidays: (year?: number) => Promise<void>;
}

const HolidayContext = createContext<HolidayContextType | undefined>(undefined);

export const HolidayProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [holidays, setHolidays] = useState<HolidayEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshHolidays = useCallback(async (year?: number) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      setHolidays([]);
      return;
    }
    const targetYear = year || new Date().getFullYear();
    setLoading(true);
    try {
      // Fetch current year + adjacent years for calendar navigation
      const [curr, prev, next] = await Promise.all([
        holidayService.getOrgHolidays(targetYear),
        holidayService.getOrgHolidays(targetYear - 1),
        holidayService.getOrgHolidays(targetYear + 1),
      ]);
      setHolidays([...prev, ...curr, ...next]);
    } catch (e) {
      // Org may not have a country set — silently ignore
      setHolidays([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (token) {
      refreshHolidays();
    }
  }, [refreshHolidays]);

  const holidayMap = React.useMemo(() => {
    const map: Record<string, HolidayEvent[]> = {};
    holidays.forEach((h) => {
      if (!map[h.date]) map[h.date] = [];
      map[h.date].push(h);
    });
    return map;
  }, [holidays]);

  const getHolidaysForDate = useCallback(
    (dateStr: string): HolidayEvent[] => holidayMap[dateStr] || [],
    [holidayMap]
  );

  const isHoliday = useCallback(
    (dateStr: string): boolean => !!(holidayMap[dateStr]?.length),
    [holidayMap]
  );

  return (
    <HolidayContext.Provider value={{ holidays, loading, getHolidaysForDate, isHoliday, refreshHolidays }}>
      {children}
    </HolidayContext.Provider>
  );
};

export const useHolidays = (): HolidayContextType => {
  const context = useContext(HolidayContext);
  if (!context) throw new Error('useHolidays must be used within a HolidayProvider');
  return context;
};
