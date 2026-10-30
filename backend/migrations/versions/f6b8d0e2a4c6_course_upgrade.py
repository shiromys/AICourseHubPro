"""Course upgrade: retire old courses without deleting them

Revision ID: f6b8d0e2a4c6
Revises: e5a7b9d1f2c4
Create Date: 2026-11-01 00:00:00.000000

Adds columns only (nothing is rewritten or removed), safe on a live table:
  courses.is_legacy (default false), courses.replaced_by_id (nullable),
  enrollments.legacy_access_until (nullable).
Every existing course stays exactly as it is (is_legacy = false) until you run the upgrade in Admin.
"""
from alembic import op
import sqlalchemy as sa


revision = 'f6b8d0e2a4c6'
down_revision = 'e5a7b9d1f2c4'
branch_labels = None
depends_on = None


def upgrade():
    op.add_column('courses', sa.Column('is_legacy', sa.Boolean(), nullable=False, server_default=sa.text('false')))
    op.add_column('courses', sa.Column('replaced_by_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_courses_replaced_by', 'courses', 'courses', ['replaced_by_id'], ['id'])
    op.add_column('enrollments', sa.Column('legacy_access_until', sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column('enrollments', 'legacy_access_until')
    op.drop_constraint('fk_courses_replaced_by', 'courses', type_='foreignkey')
    op.drop_column('courses', 'replaced_by_id')
    op.drop_column('courses', 'is_legacy')
