"""user_settings gemini_api_key

Revision ID: 20260530_0003
Revises: 20260530_0002
Create Date: 2026-05-30

"""

from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "20260530_0003"
down_revision: Union[str, None] = "20260530_0002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("user_settings", sa.Column("gemini_api_key", sa.String(length=512), nullable=True))


def downgrade() -> None:
    op.drop_column("user_settings", "gemini_api_key")
