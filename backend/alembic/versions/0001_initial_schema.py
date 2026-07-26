"""0001_initial_schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-07-26 21:15:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = '0001_initial_schema'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

def upgrade() -> None:
    # 1. Enums
    userrole_enum = postgresql.ENUM('ADMIN', 'SCHEDULER', 'MANAGER', 'EMPLOYEE', name='userrole_enum')
    userrole_enum.create(op.get_bind(), checkfirst=True)

    schedulestatus_enum = postgresql.ENUM('DRAFT', 'GENERATED', 'PUBLISHED', 'ARCHIVED', name='schedulestatus_enum')
    schedulestatus_enum.create(op.get_bind(), checkfirst=True)

    constrainttype_enum = postgresql.ENUM(
        'VACATION', 'UNAVAILABLE_DATE', 'UNAVAILABLE_RANGE', 'NO_WEEKENDS',
        'NO_NIGHTS', 'NO_SHIFT_TYPE', 'MAX_CONSECUTIVE_DAYS', 'MIN_REST_HOURS',
        'PREFERRED_DAYS_OFF', name='constrainttype_enum'
    )
    constrainttype_enum.create(op.get_bind(), checkfirst=True)

    assignmentsource_enum = postgresql.ENUM('SOLVER', 'MANUAL', name='assignmentsource_enum')
    assignmentsource_enum.create(op.get_bind(), checkfirst=True)

    # 2. Users Table
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('password_hash', sa.String(length=255), nullable=False),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('role', userrole_enum, nullable=False, server_default='EMPLOYEE'),
        sa.Column('active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)

    # 3. Departments Table
    op.create_table(
        'departments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )
    op.create_index(op.f('ix_departments_name'), 'departments', ['name'], unique=True)

    # 4. Workers Table
    op.create_table(
        'workers',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('employee_number', sa.String(length=50), nullable=False),
        sa.Column('department_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('departments.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True, unique=True),
        sa.Column('first_name', sa.String(length=100), nullable=False),
        sa.Column('last_name', sa.String(length=100), nullable=False),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('email', sa.String(length=255), nullable=True),
        sa.Column('hire_date', sa.Date(), nullable=True),
        sa.Column('weekly_contract_hours', sa.Float(), nullable=False, server_default='40.0'),
        sa.Column('active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )
    op.create_index(op.f('ix_workers_employee_number'), 'workers', ['employee_number'], unique=True)
    op.create_index(op.f('ix_workers_department_id'), 'workers', ['department_id'], unique=False)

    # 5. Skills Table
    op.create_table(
        'skills',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )
    op.create_index(op.f('ix_skills_name'), 'skills', ['name'], unique=True)

    # 6. WorkerSkills Junction Table
    op.create_table(
        'worker_skills',
        sa.Column('worker_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workers.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('skill_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('skills.id', ondelete='CASCADE'), primary_key=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
    )

    # 7. ShiftTypes Table
    op.create_table(
        'shift_types',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('color', sa.String(length=20), nullable=False, server_default='#3B82F6'),
        sa.Column('start_time', sa.Time(), nullable=False),
        sa.Column('end_time', sa.Time(), nullable=False),
        sa.Column('duration', sa.Float(), nullable=False),
        sa.Column('is_night_shift', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('requires_rest_day', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )
    op.create_index(op.f('ix_shift_types_name'), 'shift_types', ['name'], unique=True)

    # 8. WorkerConstraints Table
    op.create_table(
        'worker_constraints',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('worker_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('constraint_type', constrainttype_enum, nullable=False),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('end_date', sa.Date(), nullable=False),
        sa.Column('priority', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('enabled', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('metadata_json', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )
    op.create_index(op.f('ix_worker_constraints_worker_id'), 'worker_constraints', ['worker_id'], unique=False)
    op.create_index(op.f('ix_worker_constraints_constraint_type'), 'worker_constraints', ['constraint_type'], unique=False)

    # 9. Schedules Table
    op.create_table(
        'schedules',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('month', sa.Integer(), nullable=False),
        sa.Column('year', sa.Integer(), nullable=False),
        sa.Column('status', schedulestatus_enum, nullable=False, server_default='DRAFT'),
        sa.Column('generated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('generated_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('solver_score', sa.String(length=100), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )
    op.create_index(op.f('ix_schedules_status'), 'schedules', ['status'], unique=False)

    # 10. ShiftInstances Table
    op.create_table(
        'shift_instances',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('schedule_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('schedules.id', ondelete='CASCADE'), nullable=False),
        sa.Column('date', sa.Date(), nullable=False),
        sa.Column('shift_type_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('shift_types.id', ondelete='RESTRICT'), nullable=False),
        sa.Column('required_workers', sa.Integer(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False)
    )
    op.create_index(op.f('ix_shift_instances_schedule_id'), 'shift_instances', ['schedule_id'], unique=False)
    op.create_index(op.f('ix_shift_instances_date'), 'shift_instances', ['date'], unique=False)
    op.create_index(op.f('ix_shift_instances_shift_type_id'), 'shift_instances', ['shift_type_id'], unique=False)

    # 11. Assignments Table
    op.create_table(
        'assignments',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('shift_instance_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('shift_instances.id', ondelete='CASCADE'), nullable=False),
        sa.Column('worker_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('workers.id', ondelete='CASCADE'), nullable=False),
        sa.Column('assigned_by', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('assignment_source', assignmentsource_enum, nullable=False, server_default='SOLVER'),
        sa.Column('locked', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('shift_instance_id', 'worker_id', name='uq_shift_worker_assignment')
    )
    op.create_index(op.f('ix_assignments_shift_instance_id'), 'assignments', ['shift_instance_id'], unique=False)
    op.create_index(op.f('ix_assignments_worker_id'), 'assignments', ['worker_id'], unique=False)

    # 12. AuditLogs Table
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), sa.ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
        sa.Column('who', sa.String(length=255), nullable=True),
        sa.Column('action', sa.String(length=100), nullable=False),
        sa.Column('entity_type', sa.String(length=100), nullable=False),
        sa.Column('entity_id', sa.String(length=100), nullable=True),
        sa.Column('old_value', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('new_value', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column('ip_address', sa.String(length=50), nullable=True),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False)
    )
    op.create_index(op.f('ix_audit_logs_action'), 'audit_logs', ['action'], unique=False)
    op.create_index(op.f('ix_audit_logs_entity_type'), 'audit_logs', ['entity_type'], unique=False)

def downgrade() -> None:
    op.drop_table('audit_logs')
    op.drop_table('assignments')
    op.drop_table('shift_instances')
    op.drop_table('schedules')
    op.drop_table('worker_constraints')
    op.drop_table('shift_types')
    op.drop_table('worker_skills')
    op.drop_table('skills')
    op.drop_table('workers')
    op.drop_table('departments')
    op.drop_table('users')

    op.execute('DROP TYPE IF EXISTS assignmentsource_enum')
    op.execute('DROP TYPE IF EXISTS constrainttype_enum')
    op.execute('DROP TYPE IF EXISTS schedulestatus_enum')
    op.execute('DROP TYPE IF EXISTS userrole_enum')
