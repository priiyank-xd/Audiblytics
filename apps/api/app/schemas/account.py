from pydantic import BaseModel, ConfigDict


class AccountDeletionResponse(BaseModel):
    """DELETE /auth/account — Story 16.4. Orphaned keys are reported, never swallowed."""

    model_config = ConfigDict(populate_by_name=True)

    deletedRecordings: int
    orphanedObjectKeys: list[str]
