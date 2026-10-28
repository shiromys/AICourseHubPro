"""Footprint log, newsletter, certificate snapshots, unique flagged-payment session

Revision ID: a1c3e5f7b9d2
Revises: fbff09e03363
Create Date: 2026-10-28 00:00:00.000000

IMPORTANT: run this BEFORE replacing any course content. The backfill below freezes the
current learner name and course title onto every certificate already issued, so those
certificates keep showing what was actually awarded after the courses are restructured.
"""
from alembic import op
import sqlalchemy as sa


revision = 'a1c3e5f7b9d2'
down_revision = 'fbff09e03363'
branch_labels = None
depends_on = None


def upgrade():
    # --- 1. Digital footprint ---
    op.create_table(
        'user_activity',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('event_type', sa.String(length=40), nullable=False),
        sa.Column('path', sa.String(length=255), nullable=True),
        sa.Column('course_id', sa.Integer(), nullable=True),
        sa.Column('detail', sa.Text(), nullable=True),
        sa.Column('ip_address', sa.String(length=64), nullable=True),
        sa.Column('user_agent', sa.String(length=300), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_user_activity_user_id', 'user_activity', ['user_id'])
    op.create_index('ix_user_activity_created_at', 'user_activity', ['created_at'])

    # --- 2. Newsletter ---
    op.create_table(
        'newsletter_subscribers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('email', sa.String(length=120), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='pending'),
        sa.Column('confirm_token', sa.String(length=64), nullable=True),
        sa.Column('unsubscribe_token', sa.String(length=64), nullable=False),
        sa.Column('source', sa.String(length=30), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('confirmed_at', sa.DateTime(), nullable=True),
        sa.Column('unsubscribed_at', sa.DateTime(), nullable=True),
        sa.Column('last_sent_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
        sa.UniqueConstraint('confirm_token'),
        sa.UniqueConstraint('unsubscribe_token'),
    )
    op.create_table(
        'newsletter_issues',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('subject', sa.String(length=200), nullable=False),
        sa.Column('preheader', sa.String(length=200), nullable=True),
        sa.Column('body_html', sa.Text(), nullable=False),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='draft'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('sent_at', sa.DateTime(), nullable=True),
        sa.Column('recipient_count', sa.Integer(), nullable=True),
        sa.Column('created_by', sa.String(length=120), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # --- 3. Certificate snapshot columns + backfill of already-issued certificates ---
    op.add_column('enrollments', sa.Column('certificate_name', sa.String(length=150), nullable=True))
    op.add_column('enrollments', sa.Column('certificate_course_title', sa.String(length=255), nullable=True))
    op.execute("""
        UPDATE enrollments e
           SET certificate_name = u.name,
               certificate_course_title = c.title
          FROM users u, courses c
         WHERE e.user_id = u.id
           AND e.course_id = c.id
           AND e.certificate_id IS NOT NULL
           AND e.certificate_name IS NULL
    """)

    # --- 4. One flag per Stripe session (browser verify-payment and the webhook can race) ---
    # Existing duplicate rows would make the unique constraint fail, so keep the oldest of each.
    op.execute("""
        DELETE FROM flagged_payments a
         USING flagged_payments b
         WHERE a.stripe_session_id IS NOT NULL
           AND a.stripe_session_id = b.stripe_session_id
           AND a.id > b.id
    """)
    op.create_unique_constraint('uq_flagged_payments_stripe_session_id', 'flagged_payments', ['stripe_session_id'])


def downgrade():
    op.drop_constraint('uq_flagged_payments_stripe_session_id', 'flagged_payments', type_='unique')
    op.drop_column('enrollments', 'certificate_course_title')
    op.drop_column('enrollments', 'certificate_name')
    op.drop_table('newsletter_issues')
    op.drop_table('newsletter_subscribers')
    op.drop_index('ix_user_activity_created_at', table_name='user_activity')
    op.drop_index('ix_user_activity_user_id', table_name='user_activity')
    op.drop_table('user_activity')
