// kubejs/server_scripts/mago_magic_attribute_dump.js
//
// 명령어:
//   /mago_dump_magic_attributes
//
// 목적:
// - Cataclysm Spellbooks가 등록한 Attribute
// - T.O Magic 'n Extras (traveloptics)가 등록한 Attribute
// - namespace와 상관없이 technomancy / abyssal 이름이 들어간 Attribute
// 를 전부 server.log에 출력한다.
//
// 로그 검색 키워드:
//   MAGO_ATTRIBUTE_DUMP


var $MagoAttrBuiltInRegistries = Java.loadClass(
  'net.minecraft.core.registries.BuiltInRegistries'
)

var $MagoAttrComponent = Java.loadClass(
  'net.minecraft.network.chat.Component'
)


function magoAttrLog(message) {
  console.info(
    '[MAGO_ATTRIBUTE_DUMP] ' + message
  )
}


function magoAttrShouldInclude(id) {
  var text = String(id)

  var colon = text.indexOf(':')

  var namespace =
    colon >= 0
      ? text.substring(0, colon)
      : ''

  var path =
    colon >= 0
      ? text.substring(colon + 1)
      : text


  // Cataclysm Spellbooks 전체 Attribute
  if (
    namespace === 'cataclysm_spellbooks'
  ) {
    return true
  }


  // T.O Magic 'n Extras 전체 Attribute
  if (
    namespace === 'traveloptics'
  ) {
    return true
  }


  // 다른 모드가 Technomancy/Abyssal Attribute를
  // 등록했을 가능성까지 같이 포착
  if (
    path.indexOf('technomancy') >= 0
  ) {
    return true
  }


  if (
    path.indexOf('abyssal') >= 0
  ) {
    return true
  }


  return false
}


function magoDumpMagicAttributes(ctx) {

  try {

    var ids = []

    var iterator =
      $MagoAttrBuiltInRegistries
        .ATTRIBUTE
        .keySet()
        .iterator()


    while (iterator.hasNext()) {

      var id =
        String(
          iterator.next()
        )

      if (
        magoAttrShouldInclude(id)
      ) {
        ids.push(id)
      }
    }


    ids.sort()


    magoAttrLog(
      '============================================================'
    )

    magoAttrLog('BEGIN')

    magoAttrLog(
      '============================================================'
    )


    var cataclysmCount = 0
    var travelOpticsCount = 0
    var otherCount = 0


    for (
      var i = 0;
      i < ids.length;
      i++
    ) {

      var id = ids[i]

      var colon =
        id.indexOf(':')

      var namespace =
        colon >= 0
          ? id.substring(0, colon)
          : 'unknown'

      var path =
        colon >= 0
          ? id.substring(colon + 1)
          : id


      if (
        namespace ===
        'cataclysm_spellbooks'
      ) {
        cataclysmCount++
      } else if (
        namespace ===
        'traveloptics'
      ) {
        travelOpticsCount++
      } else {
        otherCount++
      }


      magoAttrLog(
        'ATTRIBUTE' +
        '|id=' + id +
        '|namespace=' + namespace +
        '|path=' + path
      )
    }


    magoAttrLog(
      '------------------------------------------------------------'
    )

    magoAttrLog(
      'SUMMARY' +
      '|total=' + ids.length +
      '|cataclysm_spellbooks=' +
        cataclysmCount +
      '|traveloptics=' +
        travelOpticsCount +
      '|other_tech_or_abyss=' +
        otherCount
    )


    magoAttrLog(
      '============================================================'
    )

    magoAttrLog('END')

    magoAttrLog(
      '============================================================'
    )


    ctx.source.sendSuccess(
      function() {
        return $MagoAttrComponent.literal(
          '[Mago] 마법 Attribute 덤프 완료. server.log 확인.'
        )
      },
      false
    )


    return 1

  } catch (error) {

    console.error(
      '[MAGO_ATTRIBUTE_DUMP] ERROR: ' +
      String(error)
    )


    ctx.source.sendFailure(
      $MagoAttrComponent.literal(
        '[Mago] Attribute 덤프 실패. server.log 확인.'
      )
    )


    return 0
  }
}


ServerEvents.commandRegistry(
  function(event) {

    event.register(
      event.commands
        .literal(
          'mago_dump_magic_attributes'
        )

        .requires(function(source) {
          return source.hasPermission(2)
        })

        .executes(function(ctx) {
          return magoDumpMagicAttributes(ctx)
        })
    )
  }
)