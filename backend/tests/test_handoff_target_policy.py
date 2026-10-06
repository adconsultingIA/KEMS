from app.api.handoffs import (
    EXCLUDED_TARGET_CODES,
    is_handoff_target,
)
from app.models.organizational_unit import (
    OrganizationalUnit,
)


def make_unit(
    code: str,
    *,
    active: bool = True,
):
    return OrganizationalUnit(
        name=code.title(),
        code=code,
        unit_type="business_unit",
        is_active=active,
    )


def test_direction_is_not_target():
    assert not is_handoff_target(
        make_unit(
            "DIRECTION"
        )
    )


def test_commercial_is_not_target():
    assert not is_handoff_target(
        make_unit(
            "COMMERCIAL"
        )
    )


def test_kems_root_is_not_target():
    assert not is_handoff_target(
        make_unit(
            "KEMS"
        )
    )


def test_any_active_business_unit_can_be_target():
    for code in (
        "ASSURANCE",
        "TECHNOLOGIES",
        "INVESTISSEMENT",
        "FIDUCIAIRE",
        "IMMOBILIER",
        "CONSULTING",
        "MANAGEMENT",
        "TRADING",
    ):
        assert is_handoff_target(
            make_unit(
                code
            )
        )


def test_inactive_unit_is_not_target():
    assert not is_handoff_target(
        make_unit(
            "IMMOBILIER",
            active=False,
        )
    )


def test_exclusion_policy_is_small_and_structural():
    assert EXCLUDED_TARGET_CODES == {
        "KEMS",
        "DIRECTION",
        "COMMERCIAL",
    }
