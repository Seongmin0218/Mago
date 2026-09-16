// Mago - Gun Manufacturing License
// 총기 제작 라이선스의 활성화와 TaCZ 제작 작업대 접근을 관리한다.
//
// 거너 전문화와 제작 라이선스는 서로 다른 상태다.
//
// 거너 전문화:
//   Puffish Skills의 현재 전투 전문화.
//   비활성화하면 거너 Attribute/스킬 효과도 비활성화.
//
// 총기 제작 라이선스:
//   한 번 활성화하면 영구 유지되는 제작 자격.
//   거너 전문화를 나중에 비활성화해도 유지한다.

(function () {
  const $Component = Java.loadClass('net.minecraft.network.chat.Component')

  const LICENSE_ITEM = 'kubejs:gun_manufacturing_license'
  const LICENSE_TAG = 'mago_gun_manufacturing_license'

  const MANUFACTURING_TABLES = [
    'tacz:gun_smith_table', // 총기 작업대
    'tacz:workbench_a',     // 탄약 작업대
    'tacz:workbench_c'      // 부착물 작업대
  ]

  function hasManufacturingLicense(player) {
    return player != null && player.getTags().contains(LICENSE_TAG)
  }

  function activateManufacturingLicense(player) {
    if (hasManufacturingLicense(player)) {
      player.displayClientMessage(
        $Component.literal('이미 총기 제작 라이선스가 활성화되어 있습니다.'),
        true
      )
      return false
    }

    // 영구 제작자격.
    // 거너 전문화 비활성화 시에도 이 태그는 제거하지 않는다.
    player.addTag(LICENSE_TAG)

    player.displayClientMessage(
      $Component.literal('총기 제작 라이선스가 활성화되었습니다.'),
      true
    )

    player.tell(
      $Component.literal(
        '이제 총기·탄약·부착물 작업대를 사용할 수 있습니다.'
      )
    )

    return true
  }

  // ------------------------------------------------------------
  // 총기 제작 라이선스 아이템
  // ------------------------------------------------------------
  //
  // 사용해도 아이템은 없어지지 않는다.
  // 따라서 stack.shrink() 같은 처리를 하지 않는다.
  //
  // 라이선스를 잃어버린 경우 별도의 NPC/운영 기능으로 재발급할 수 있다.
  ItemEvents.rightClicked(LICENSE_ITEM, event => {
    const player = event.player
    if (player == null) return

    activateManufacturingLicense(player)

    // 커스텀 아이템의 추가 기본 사용 처리를 막고 성공 처리.
    event.success()
  })

  // ------------------------------------------------------------
  // TaCZ 제작 작업대 접근 제한
  // ------------------------------------------------------------
  //
  // pufferfish_item_gating의 block interact gate는
  // Sneak 상태에서 의도적으로 우회되므로,
  // 반드시 차단되어야 하는 제작 작업대에는 KubeJS 서버 판정을 사용한다.
  //
  // 이 판정은 거너 전문화가 아니라 영구 제작 라이선스만 본다.
  MANUFACTURING_TABLES.forEach(blockId => {
    BlockEvents.rightClicked(blockId, event => {
      const player = event.player
      if (player == null) return

      if (hasManufacturingLicense(player)) {
        return
      }

      player.displayClientMessage(
        $Component.literal(
          '총기 제작 라이선스가 없어 이 작업대를 사용할 수 없습니다.'
        ),
        true
      )

      event.cancel()
    })
  })
})()