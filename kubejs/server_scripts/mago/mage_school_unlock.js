// Mago - Mage Basic School Reset Watcher v2
//
// 주의:
// global.MagoMageSchools는 startup_scripts/mago/mage_school_unlock_items.js
// 에서 정의한다. KubeJS 1.21에서는 server_scripts에서 global 값을 SET하지 않는다.

(function () {

  PlayerEvents.tick(event => {
    const player = event.player

    if (player == null) {
      return
    }


    // 1초에 1회만 검사.
    if ((player.tickCount % 20) !== 0) {
      return
    }


    // 전문화가 비활성 상태면 reset 감지하지 않는다.
    if (
      !player.getTags()
        .contains('mago_mage_active')
    ) {
      return
    }


    const api =
      global.MagoMageSchools

    if (api == null) {
      return
    }


    // 최초 학파가 남아 있으면 정상.
    if (api.hasPrimary(player)) {
      return
    }


    // 기본학파 자체가 하나도 없으면 정리할 것도 없음.
    if (api.count(player) <= 0) {
      return
    }


    // active 상태인데 primary root가 사라졌고
    // 학파 권한만 남아 있으면 mage reset으로 간주.
    api.clear(player)

    player.tell(
      '마법사 스킬 초기화로 기본 학파 사용권이 모두 회수되었습니다.'
    )
  })
})()
