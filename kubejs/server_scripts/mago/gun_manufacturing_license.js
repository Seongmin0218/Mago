// Mago - Gun Manufacturing License
// Independent permanent qualification for TaCZ manufacturing benches.

(function () {
  const $Component = Java.loadClass('net.minecraft.network.chat.Component')

  const LICENSE_ITEM = 'kubejs:gun_manufacturing_license'
  const LICENSE_TAG = 'mago_gun_manufacturing_license'

  const MANUFACTURING_TABLES = [
    'tacz:gun_smith_table', // Gun Smith Table
    'tacz:workbench_a',     // Ammo Assembly Table
    'tacz:workbench_c'      // Attachment Table
  ]

  function hasManufacturingLicense(player) {
    return player != null && player.getTags().contains(LICENSE_TAG)
  }

  function activateManufacturingLicense(player) {
    if (hasManufacturingLicense(player)) {
      player.displayClientMessage(
        $Component.literal('이미 총기 제조 라이선스가 활성화되어 있습니다.'),
        true
      )
      return false
    }

    player.addTag(LICENSE_TAG)

    player.displayClientMessage(
      $Component.literal('총기 제조 라이선스가 활성화되었습니다.'),
      true
    )
    player.tell($Component.literal('총기·탄약·부착물 작업대를 사용할 수 있습니다.'))

    return true
  }

  // Physical license item.
  // The stack is intentionally NOT shrunk, so the item remains after use.
  ItemEvents.rightClicked(LICENSE_ITEM, event => {
    if (event.player == null) return

    activateManufacturingLicense(event.player)

    // Stop any further default use handling for this custom item.
    event.success()
  })

  // Bench access is based only on the permanent manufacturing qualification.
  // Gunner specialization state and Gunner License I~V do not affect whether
  // the bench can be opened.
  MANUFACTURING_TABLES.forEach(blockId => {
    BlockEvents.rightClicked(blockId, event => {
      const player = event.player
      if (player == null) return

      if (hasManufacturingLicense(player)) {
        return
      }

      player.displayClientMessage(
        $Component.literal('총기 제조 라이선스가 없어 이 작업대를 사용할 수 없습니다.'),
        true
      )
      event.cancel()
    })
  })
})();
