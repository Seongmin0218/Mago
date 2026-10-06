// kubejs/server_scripts/mago_spell_school_trace.js
//
// Iron's Spells 계열 주문의 학파가
// 어디에서 결정/변경되는지 추적하기 위한 진단 스크립트.
//
// 명령어:
//   /mago_trace_school
//
// 로그 검색:
//   MAGO_SCHOOL_TRACE
//
// 비교하는 값:
//
// RAW_DEFAULT
//   spell.getDefaultConfig().schoolResource
//   애드온 주문 클래스가 기본으로 선언한 학파
//
// MANAGER_DEFAULT
//   SpellConfigManager.getSpellDefaultConfigValue(...)
//   Iron's ConfigManager가 보유하는 기본 학파
//
// RUNTIME
//   spell.getSchoolType()
//   실제 게임에서 최종 적용되는 학파
//
// 특히 Lightning 및 Technomancy 관련 주문을 출력한다.


var $MagoTraceSpellRegistry = Java.loadClass(
  'io.redspace.ironsspellbooks.api.registry.SpellRegistry'
)

var $MagoTraceSpellConfigManager = Java.loadClass(
  'io.redspace.ironsspellbooks.api.config.SpellConfigManager'
)

var $MagoTraceSpellConfigParameter = Java.loadClass(
  'io.redspace.ironsspellbooks.api.config.SpellConfigParameter'
)

var $MagoTraceComponent = Java.loadClass(
  'net.minecraft.network.chat.Component'
)


// ============================================================
// 기본 함수
// ============================================================

function magoTraceLog(message) {
  console.info('[MAGO_SCHOOL_TRACE] ' + message)
}


function magoTraceRegistryToArray(registry) {
  var result = []
  var iterator = registry.iterator()

  while (iterator.hasNext()) {
    result.push(iterator.next())
  }

  return result
}


function magoTraceSpellId(spell) {
  try {
    return String(spell.getSpellId())
  } catch (error1) {
    try {
      var key = $MagoTraceSpellRegistry.REGISTRY.getKey(spell)

      if (key != null) {
        return String(key)
      }
    } catch (error2) {
      // 무시
    }
  }

  return 'unknown'
}


function magoTraceSchoolId(school) {
  try {
    if (school == null) {
      return 'null'
    }

    return String(school.getId())
  } catch (error) {
    return 'error'
  }
}


// ============================================================
// RAW DEFAULT
// ============================================================

function magoTraceRawDefaultSchool(spell) {
  try {
    var config = spell.getDefaultConfig()

    if (config == null) {
      return 'null'
    }

    if (config.schoolResource == null) {
      return 'null'
    }

    return String(config.schoolResource)
  } catch (error) {
    return 'ERROR:' + String(error)
  }
}


// ============================================================
// CONFIG MANAGER DEFAULT
// ============================================================

function magoTraceManagerDefaultSchool(spell) {
  try {
    var school =
      $MagoTraceSpellConfigManager.getSpellDefaultConfigValue(
        spell,
        $MagoTraceSpellConfigParameter.SCHOOL
      )

    return magoTraceSchoolId(school)

  } catch (error) {
    return 'ERROR:' + String(error)
  }
}


// ============================================================
// 최종 RUNTIME
// ============================================================

function magoTraceRuntimeSchool(spell) {
  try {
    return magoTraceSchoolId(
      spell.getSchoolType()
    )
  } catch (error) {
    return 'ERROR:' + String(error)
  }
}


// ============================================================
// 실제 Java 주문 클래스
// ============================================================

function magoTraceClassName(spell) {
  try {
    return String(
      spell.getClass().getName()
    )
  } catch (error) {
    return 'unknown'
  }
}


// ============================================================
// Namespace
// ============================================================

function magoTraceNamespace(spellId) {
  var text = String(spellId)
  var colon = text.indexOf(':')

  if (colon < 0) {
    return 'unknown'
  }

  return text.substring(0, colon)
}


// ============================================================
// 출력 대상 여부
//
// 1. Runtime Lightning
// 2. 어느 단계든 Technomancy
// ============================================================

function magoTraceShouldPrint(
  spellId,
  rawDefault,
  managerDefault,
  runtimeSchool
) {

  if (
    runtimeSchool === 'irons_spellbooks:lightning'
  ) {
    return true
  }

  if (
    String(rawDefault).indexOf('technomancy') >= 0
  ) {
    return true
  }

  if (
    String(managerDefault).indexOf('technomancy') >= 0
  ) {
    return true
  }

  if (
    String(runtimeSchool).indexOf('technomancy') >= 0
  ) {
    return true
  }

  return false
}


// ============================================================
// 진단 판정
// ============================================================

function magoTraceDiagnosis(
  rawDefault,
  managerDefault,
  runtimeSchool
) {

  if (
    rawDefault === managerDefault &&
    managerDefault === runtimeSchool
  ) {

    if (
      runtimeSchool === 'irons_spellbooks:lightning'
    ) {
      return 'RAW_DEFAULT_ALREADY_LIGHTNING'
    }

    if (
      String(runtimeSchool).indexOf('technomancy') >= 0
    ) {
      return 'TECHNOMANCY_FROM_SOURCE'
    }

    return 'UNCHANGED'
  }


  if (
    rawDefault === managerDefault &&
    managerDefault !== runtimeSchool
  ) {
    return 'RUNTIME_OVERRIDE_AFTER_DEFAULT'
  }


  if (
    rawDefault !== managerDefault
  ) {
    return 'MANAGER_DEFAULT_CHANGED'
  }


  return 'UNKNOWN'
}


// ============================================================
// 메인 실행
// ============================================================

function magoRunSchoolTrace(ctx) {

  try {

    var spellList =
      magoTraceRegistryToArray(
        $MagoTraceSpellRegistry.REGISTRY
      )


    spellList.sort(function(a, b) {

      var aId = magoTraceSpellId(a)
      var bId = magoTraceSpellId(b)

      if (aId < bId) return -1
      if (aId > bId) return 1

      return 0
    })


    var printedCount = 0

    var rawLightningCount = 0
    var runtimeOverrideCount = 0
    var managerChangedCount = 0

    var technomancyRuntimeCount = 0


    magoTraceLog(
      '============================================================'
    )

    magoTraceLog('BEGIN')

    magoTraceLog(
      '============================================================'
    )


    for (
      var i = 0;
      i < spellList.length;
      i++
    ) {

      var spell =
        spellList[i]

      var spellId =
        magoTraceSpellId(spell)

      var namespace =
        magoTraceNamespace(spellId)

      var className =
        magoTraceClassName(spell)

      var rawDefault =
        magoTraceRawDefaultSchool(spell)

      var managerDefault =
        magoTraceManagerDefaultSchool(spell)

      var runtimeSchool =
        magoTraceRuntimeSchool(spell)

      var diagnosis =
        magoTraceDiagnosis(
          rawDefault,
          managerDefault,
          runtimeSchool
        )


      if (
        runtimeSchool.indexOf('technomancy') >= 0
      ) {
        technomancyRuntimeCount++
      }


      if (
        diagnosis ===
        'RAW_DEFAULT_ALREADY_LIGHTNING'
      ) {
        rawLightningCount++
      }

      if (
        diagnosis ===
        'RUNTIME_OVERRIDE_AFTER_DEFAULT'
      ) {
        runtimeOverrideCount++
      }

      if (
        diagnosis ===
        'MANAGER_DEFAULT_CHANGED'
      ) {
        managerChangedCount++
      }


      if (
        !magoTraceShouldPrint(
          spellId,
          rawDefault,
          managerDefault,
          runtimeSchool
        )
      ) {
        continue
      }


      printedCount++


      magoTraceLog(
        'SPELL' +
        '|id=' + spellId +
        '|namespace=' + namespace +
        '|class=' + className +
        '|raw_default=' + rawDefault +
        '|manager_default=' + managerDefault +
        '|runtime=' + runtimeSchool +
        '|diagnosis=' + diagnosis
      )
    }


    // ========================================================
    // 전체 요약
    // ========================================================

    magoTraceLog(
      '------------------------------------------------------------'
    )

    magoTraceLog(
      'SUMMARY' +
      '|total_spells=' + spellList.length +
      '|printed=' + printedCount +
      '|raw_default_lightning=' +
        rawLightningCount +
      '|runtime_override=' +
        runtimeOverrideCount +
      '|manager_default_changed=' +
        managerChangedCount +
      '|runtime_technomancy=' +
        technomancyRuntimeCount
    )


    magoTraceLog(
      '============================================================'
    )

    magoTraceLog('END')

    magoTraceLog(
      '============================================================'
    )


    ctx.source.sendSuccess(
      function() {
        return $MagoTraceComponent.literal(
          '[Mago] 학파 원인 추적 완료. ' +
          '로그에서 MAGO_SCHOOL_TRACE 검색.'
        )
      },
      false
    )


    return 1

  } catch (error) {

    console.error(
      '[MAGO_SCHOOL_TRACE] ERROR: ' +
      String(error)
    )

    try {
      if (
        error != null &&
        error.stack != null
      ) {
        console.error(
          '[MAGO_SCHOOL_TRACE] STACK: ' +
          String(error.stack)
        )
      }
    } catch (ignored) {
      // 무시
    }


    ctx.source.sendFailure(
      $MagoTraceComponent.literal(
        '[Mago] 학파 추적 실패. server.log 확인.'
      )
    )


    return 0
  }
}


// ============================================================
// 명령어 등록
// ============================================================

ServerEvents.commandRegistry(
  function(event) {

    event.register(
      event.commands
        .literal('mago_trace_school')

        .requires(function(source) {
          return source.hasPermission(2)
        })

        .executes(function(ctx) {
          return magoRunSchoolTrace(ctx)
        })
    )
  }
)