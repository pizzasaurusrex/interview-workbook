def get_variant(feature: str, flags: dict) -> str:
    pass


def get_variant_for_user(user_id: str, feature: str, flags: dict) -> str:
    pass


class FeatureFlagService:
    def __init__(self, initial_flags: dict, timestamp: float):
        pass

    def update_flags(self, new_flags: dict, timestamp: float) -> None:
        pass

    def get_variant_at(self, user_id: str, feature: str, timestamp: float) -> str:
        pass
