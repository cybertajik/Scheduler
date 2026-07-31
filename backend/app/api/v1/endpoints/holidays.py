"""
API endpoint for public holidays using the `holidays` Python library.
GET /holidays/countries - returns all supported countries
GET /organizations/current/holidays?year=YYYY - returns holidays for the org's configured countries
"""
from typing import List, Optional
from datetime import date
import holidays as holidays_lib
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.api.v1.deps import get_current_user
from app.models import User, Organization

router = APIRouter()


class CountryInfo(BaseModel):
    code: str
    name: str


class HolidayEvent(BaseModel):
    date: str       # ISO format YYYY-MM-DD
    name: str
    country: str    # ISO2 code


# Human-readable country names for the supported ISO codes
COUNTRY_NAMES: dict[str, str] = {
    "AL": "Albania", "AD": "Andorra", "AR": "Argentina", "AM": "Armenia",
    "AU": "Australia", "AT": "Austria", "AZ": "Azerbaijan", "BY": "Belarus",
    "BE": "Belgium", "BO": "Bolivia", "BA": "Bosnia and Herzegovina",
    "BR": "Brazil", "BG": "Bulgaria", "CA": "Canada", "CL": "Chile",
    "CN": "China", "CO": "Colombia", "HR": "Croatia", "CY": "Cyprus",
    "CZ": "Czech Republic", "DK": "Denmark", "DO": "Dominican Republic",
    "EG": "Egypt", "EE": "Estonia", "ET": "Ethiopia", "FI": "Finland",
    "FR": "France", "GE": "Georgia", "DE": "Germany", "GR": "Greece",
    "HN": "Honduras", "HK": "Hong Kong", "HU": "Hungary", "IS": "Iceland",
    "IN": "India", "ID": "Indonesia", "IE": "Ireland", "IL": "Israel",
    "IT": "Italy", "JM": "Jamaica", "JP": "Japan", "KZ": "Kazakhstan",
    "KE": "Kenya", "KR": "South Korea", "KW": "Kuwait", "LV": "Latvia",
    "LS": "Lesotho", "LI": "Liechtenstein", "LT": "Lithuania", "LU": "Luxembourg",
    "MG": "Madagascar", "MW": "Malawi", "MY": "Malaysia", "MT": "Malta",
    "MX": "Mexico", "MD": "Moldova", "MC": "Monaco", "ME": "Montenegro",
    "MA": "Morocco", "MZ": "Mozambique", "NA": "Namibia", "NL": "Netherlands",
    "NZ": "New Zealand", "NI": "Nicaragua", "NG": "Nigeria", "MK": "North Macedonia",
    "NO": "Norway", "PK": "Pakistan", "PY": "Paraguay", "PE": "Peru",
    "PH": "Philippines", "PL": "Poland", "PT": "Portugal", "RO": "Romania",
    "RU": "Russia", "SA": "Saudi Arabia", "RS": "Serbia", "SG": "Singapore",
    "SK": "Slovakia", "SI": "Slovenia", "ZA": "South Africa", "ES": "Spain",
    "SR": "Suriname", "SE": "Sweden", "CH": "Switzerland", "TW": "Taiwan",
    "TZ": "Tanzania", "TH": "Thailand", "TT": "Trinidad and Tobago",
    "TN": "Tunisia", "TR": "Turkey", "UG": "Uganda", "UA": "Ukraine",
    "AE": "United Arab Emirates", "GB": "United Kingdom", "US": "United States",
    "UY": "Uruguay", "UZ": "Uzbekistan", "VE": "Venezuela", "VN": "Vietnam",
    "ZM": "Zambia", "ZW": "Zimbabwe",
}

# Country to date format mapping (strftime-style)
COUNTRY_DATE_FORMATS: dict[str, str] = {
    "US": "MM/DD/YYYY", "PH": "MM/DD/YYYY",
    "CN": "YYYY/MM/DD", "JP": "YYYY/MM/DD", "KR": "YYYY/MM/DD",
    "TW": "YYYY/MM/DD", "HU": "YYYY.MM.DD", "IR": "YYYY/MM/DD",
}
DEFAULT_DATE_FORMAT = "DD/MM/YYYY"


def _get_country_date_format(code: str) -> str:
    return COUNTRY_DATE_FORMATS.get(code, DEFAULT_DATE_FORMAT)


def _fetch_holidays_for_country(code: str, year: int) -> List[HolidayEvent]:
    """Fetch public holidays for a given country ISO2 code and year."""
    events: List[HolidayEvent] = []
    try:
        country_holidays = holidays_lib.country_holidays(code, years=year)
        for h_date, h_name in sorted(country_holidays.items()):
            events.append(HolidayEvent(
                date=h_date.isoformat(),
                name=h_name,
                country=code,
            ))
    except (NotImplementedError, KeyError):
        pass
    return events


@router.get("/countries", response_model=List[CountryInfo])
def list_supported_countries():
    """Return a sorted list of countries supported for public holiday lookup."""
    supported = holidays_lib.list_supported_countries()
    result = []
    for code in sorted(supported.keys()):
        name = COUNTRY_NAMES.get(code, code)
        result.append(CountryInfo(code=code, name=name))
    return result


@router.get("/org-holidays", response_model=List[HolidayEvent])
def get_org_holidays(
    year: int = Query(default=date.today().year, ge=2000, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return public holidays for the current organization's configured countries."""
    org: Optional[Organization] = None
    if current_user.organization_id:
        org = db.query(Organization).filter(
            Organization.id == current_user.organization_id
        ).first()

    if not org or not org.country_code:
        return []

    events = _fetch_holidays_for_country(org.country_code, year)

    if org.extra_country_code and org.extra_country_code != org.country_code:
        events += _fetch_holidays_for_country(org.extra_country_code, year)

    # Sort by date
    events.sort(key=lambda e: e.date)
    return events


@router.get("/date-format")
def get_country_date_format(
    country_code: str = Query(..., max_length=5),
    current_user: User = Depends(get_current_user),
):
    """Return the conventional date format string for a country."""
    return {"country_code": country_code, "date_format": _get_country_date_format(country_code)}
