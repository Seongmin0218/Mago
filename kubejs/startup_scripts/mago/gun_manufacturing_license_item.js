// Mago - Gun Manufacturing License Item
// 신규 아이템 등록 파일이므로 수정 후 클라이언트/서버 완전 재시작 필요.

(function () {
  StartupEvents.registry('item', event => {
    event.create('gun_manufacturing_license')
      .displayName('총기 제작 라이선스')
      .unstackable()
      .rarity('rare')
      .glow(true)
      .texture('minecraft:item/paper')
      .tooltip('§7거너 전문화 취득 시 지급되는 총기 제작 자격증입니다.')
      .tooltip('§7우클릭하여 총기 제작 자격을 영구 활성화합니다.')
      .tooltip('§8활성화해도 아이템은 사라지지 않습니다.')
      .tooltip('§8분실 시 재발급받을 수 있습니다.')
  })
})()