// Mago - Gun Manufacturing License item
// KubeJS 1.21.1 startup script.
// New custom items require a full client/server restart after adding this file.

(function () {
  StartupEvents.registry('item', event => {
    event.create('gun_manufacturing_license')
      .displayName('총기 제조 라이선스')
      .unstackable()
      .rarity('rare')
      .glow(true)
      .texture('minecraft:item/paper')
      .tooltip('§7우클릭하여 총기 제조 자격을 활성화합니다.')
      .tooltip('§8사용해도 아이템은 소모되지 않습니다.')
      .tooltip('§8분실 시 운영 정책에 따라 재발급 가능합니다.')
  })
})();
