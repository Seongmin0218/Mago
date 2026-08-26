var $BuiltInRegistries = Java.loadClass(
  'net.minecraft.core.registries.BuiltInRegistries'
)

var $Component = Java.loadClass(
  'net.minecraft.network.chat.Component'
)


function magoAttrDescLog(message) {
  console.info('[MAGO_ATTRIBUTE_DESCRIPTION] ' + message)
}


function shouldDumpAttribute(idText) {
  var colon = idText.indexOf(':')

  if (colon < 0) {
    return false
  }

  var namespace = idText.substring(0, colon)
  var path = idText.substring(colon + 1)

  var relevantNamespace =
    namespace === 'cataclysm_spellbooks' ||
    namespace === 'aces_spell_utils' ||
    namespace === 'traveloptics'

  var relevantPath =
    path.indexOf('technomancy') >= 0 ||
    path.indexOf('abyssal') >= 0

  return relevantNamespace && relevantPath
}


function magoDumpAttributeDescriptions(ctx) {
  try {
    var registry = $BuiltInRegistries.ATTRIBUTE
    var iterator = registry.keySet().iterator()

    var count = 0
    var errors = 0

    magoAttrDescLog(
      '============================================================'
    )
    magoAttrDescLog('BEGIN')
    magoAttrDescLog(
      '============================================================'
    )

    while (iterator.hasNext()) {
      var id = iterator.next()
      var idText = String(id)

      if (!shouldDumpAttribute(idText)) {
        continue
      }

      try {
        var attribute = registry.get(id)

        var descriptionId = String(
          attribute.getDescriptionId()
        )

        magoAttrDescLog(
          'ATTRIBUTE' +
          '|id=' + idText +
          '|description_id=' + descriptionId
        )

        count++
      } catch (error) {
        errors++

        magoAttrDescLog(
          'ERROR' +
          '|id=' + idText +
          '|error=' + String(error)
        )
      }
    }

    magoAttrDescLog(
      'SUMMARY' +
      '|count=' + count +
      '|errors=' + errors
    )

    magoAttrDescLog(
      '============================================================'
    )
    magoAttrDescLog('END')
    magoAttrDescLog(
      '============================================================'
    )

    ctx.source.sendSuccess(
      function() {
        return $Component.literal(
          '[Mago] Attribute description ID 덤프 완료.'
        )
      },
      false
    )

    return 1

  } catch (error) {
    console.error(
      '[MAGO_ATTRIBUTE_DESCRIPTION] FATAL|' +
      String(error)
    )

    ctx.source.sendFailure(
      $Component.literal(
        '[Mago] Attribute description ID 덤프 실패.'
      )
    )

    return 0
  }
}


ServerEvents.commandRegistry(function(event) {
  event.register(
    event.commands
      .literal('mago_dump_attribute_descriptions')
      .requires(function(source) {
        return source.hasPermission(2)
      })
      .executes(function(ctx) {
        return magoDumpAttributeDescriptions(ctx)
      })
  )
})