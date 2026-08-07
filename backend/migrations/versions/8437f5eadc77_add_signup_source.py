"""Add signup_source column

Revision ID: 8437f5eadc77
Revises: 56ca649f1f68
Create Date: 2026-08-06 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8437f5eadc77'
down_revision = '56ca649f1f68'
branch_labels = None
depends_on = None


def upgrade():
    # server_default backfills every existing production user as 'signup' -
    # accurate, since guest checkout didn't exist before this feature.
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.add_column(sa.Column('signup_source', sa.String(length=30), nullable=False, server_default='signup'))

    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.alter_column('signup_source', server_default=None)


def downgrade():
    with op.batch_alter_table('users', schema=None) as batch_op:
        batch_op.drop_column('signup_source')
