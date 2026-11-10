// Mago - Celestisynth Balance
//
// Celestisynth 히든 전사 무기 7종 1차 화력 보정.
//
// 원칙:
// - 모든 무기를 같은 공격력으로 맞추지 않는다.
// - 스킬 계수, 다단히트 횟수, 쿨다운, HP 비례 피해를 포함해
//   각 무기의 역할에 따라 기본 공격력을 다르게 배분한다.
// - 스킬 자체 계수는 1차 단계에서 수정하지 않는다.
// - 실제 종결 전문화/인챈트 적용 후 과도한 증폭이 확인되면
//   2차로 개별 스킬 계수를 조정한다.
//
// KubeJS item.attackDamage 값은 현재 환경에서
// 실제 툴팁 공격력보다 1 낮게 표시되는 것을 실측 확인.
// 예: attackDamage = 35 -> 툴팁 36

ItemEvents.modification(event => {

  // ------------------------------------------------------------
  // Aquaflora
  // ------------------------------------------------------------
  //
  // 지속딜 / 광역 난무형.
  //
  // attackDamage 35에서 실측:
  // - 툴팁 공격력: 36
  // - Petal Pierces 1타: 약 3.6
  // - 무스탯/무인챈트 10초 지속: 약 140 DPS
  //
  // 현재 값 유지.
  event.modify('celestisynth:aquaflora', item => {
    item.attackDamage = 35
  })


  // ------------------------------------------------------------
  // Keres
  // ------------------------------------------------------------
  //
  // 초장기 차징 / 보스 처형형.
  //
  // Rend:
  // baseDamage = 공격력 * 1.5
  //
  // 최종 피해:
  // baseDamage
  // + targetMaxHealth * (baseDamage * 0.015)
  //
  // attackDamage 20 -> 툴팁 21 기준
  // HP가 매우 높은 대상에서는 약 47.25% Max HP 피해로 수렴.
  //
  // 10초 풀차징이라는 큰 비용이 있지만
  // 공격력을 더 올리면 HP 비례 피해가 지나치게 폭증하므로
  // 다른 Celestisynth 무기보다 낮게 유지한다.
  event.modify('celestisynth:keres', item => {
    item.attackDamage = 20
  })


  // ------------------------------------------------------------
  // Solaris
  // ------------------------------------------------------------
  //
  // 기동형 지속 광역딜.
  //
  // Full Round:
  // - 공격력 * 0.23
  // - 공격 구간 약 36 ticks
  // - 대상이 범위에 계속 있을 경우 다단히트
  //
  // Soul Dash:
  // - 공격력 * 0.18 / tick
  // - 실제 한 대상 접촉은 과거 관찰상 약 2~3 ticks
  //
  // 기본 공격력은 높게 주되,
  // Full Round의 다단히트 때문에 Aquaflora보다는 약간 낮게 배정.
  event.modify('celestisynth:solaris', item => {
    item.attackDamage = 32
  })


  // ------------------------------------------------------------
  // Crescentia
  // ------------------------------------------------------------
  //
  // 중거리 / 광역 / 투사체 제어형.
  //
  // Barrage:
  // - 공격력 * 0.07 / tick
  // - 약 46 ticks 공격 가능
  //
  // Dragon:
  // - 공격력 * 0.08 / tick
  // - 기본 3방향
  // - Multishot 사용 시 5방향
  // - 각 Dragon은 최대 약 100 ticks 존속 가능
  //
  // 실제 투사체가 분산되므로 전탄 단일 대상 적중을 전제로 하진 않지만,
  // 여러 Dragon이 겹치는 상황에서 폭증할 수 있어 30으로 제한.
  event.modify('celestisynth:crescentia', item => {
    item.attackDamage = 30
  })


  // ------------------------------------------------------------
  // Breezebreaker
  // ------------------------------------------------------------
  //
  // 고속 콤보 / 기동 / 광역형.
  //
  // 주요 계수:
  // - Galestorm: 1.3x
  // - Dual Galestorm: 1.3x * 2회
  // - Wheel: 1.4x
  // - Wind Roar: 2.0x + 거리당 추가 계수
  // - Tornado: 0.1x / tick, 최대 약 100 ticks
  //
  // 기본 스킬 쿨다운도 짧고,
  // Tornado가 장시간 적을 물면 누적 피해가 크게 올라가므로
  // 기본 공격력을 낮게 배정한다.
  event.modify('celestisynth:breezebreaker', item => {
    item.attackDamage = 24
  })


  // ------------------------------------------------------------
  // Poltergeist
  // ------------------------------------------------------------
  //
  // 중량 Burst / 방어 / 제어형.
  //
  // Cosmic Steel:
  // - 일반 Impact: 1.2x
  // - Giant Impact: 1.5x
  // - 낙하 높이에 따른 추가 고정 피해
  // - 기본 쿨다운 약 200 ticks
  //
  // Barrier Call:
  // - 0.8x
  //
  // 타수와 공격속도가 낮고 스킬 쿨도 길기 때문에
  // 7종 중 가장 높은 기본 공격력을 허용.
  event.modify('celestisynth:poltergeist', item => {
    item.attackDamage = 38
  })


  // ------------------------------------------------------------
  // Frostbound
  // ------------------------------------------------------------
  //
  // 콤보 Burst / 광역 CC형.
  //
  // Frostbound Dance:
  // - 첫 Impact: 1.5x
  // - Slash 3회: 각각 1.7x
  // - 총 직접 계수: 6.6x
  // - 추가 Wintereis Shard 발사
  //
  // Cryogenesis:
  // - 한 Ice Cast당 1.2x
  // - Cast Level 5에서 연쇄적으로 전방 생성
  //
  // 한 번의 스킬에서 높은 총계수가 나오므로
  // 기본 공격력은 중간 이하로 제한.
  event.modify('celestisynth:frostbound', item => {
    item.attackDamage = 26
  })
})