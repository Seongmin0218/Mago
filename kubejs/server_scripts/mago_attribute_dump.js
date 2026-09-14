// kubejs/server_scripts/mago_attribute_dump.js
//
// Mago Attribute Registry 런타임 덤프 v2
//
// 명령어:
//   /mago_dump_attributes
//
// 로그 검색:
//   MAGO_ATTRIBUTE_DUMP
//
// 목적:
// 1. 현재 모드팩에 등록된 모든 Attribute Registry ID 확인
// 2. Java 클래스 / Description ID / 기본값 / min / max 확인
// 3. 클라이언트 동기화 여부 확인
// 4. 명령 실행 플레이어가 실제 AttributeInstance를 보유하는지 확인
// 5. 플레이어의 Base Value / Final Value 확인
// 6. namespace별 통계 생성
//
// v2:
// Registry value -> getKey(value) 역조회를 제거.
// Registry.entrySet()에서 ResourceKey + Attribute를 직접 읽는다.


var $MagoBuiltInRegistries = Java.loadClass(
  'net.minecraft.core.registries.BuiltInRegistries'
)

var $MagoComponent = Java.loadClass(
  'net.minecraft.network.chat.Component'
)

var $MagoAttributeRegistry =
  $MagoBuiltInRegistries.ATTRIBUTE


// ============================================================
// 기본 함수
// ============================================================

function magoAttributeLog(message) {
  console.info(
    '[MAGO_ATTRIBUTE_DUMP] ' + message
  )
}


function magoAttributeSafeText(value) {
  if (value == null) {
    return 'null'
  }

  return String(value)
    .replace(/\|/g, '/')
    .replace(/\r/g, ' ')
    .replace(/\n/g, ' ')
}


function magoAttributeNamespace(id) {
  var text = String(id)

  var index =
    text.indexOf(':')

  if (index < 0) {
    return 'unknown'
  }

  return text.substring(
    0,
    index
  )
}


// ============================================================
// Registry Entry 전체 추출
//
// 중요:
// attribute 객체를 Registry.getKey(attribute)에 다시 넣지 않는다.
//
// entrySet():
//   key   = ResourceKey<Attribute>
//   value = Attribute
// ============================================================

function magoAttributeRegistryEntries(registry) {
  var result = []

  var iterator =
    registry
      .entrySet()
      .iterator()

  while (
    iterator.hasNext()
  ) {
    var entry =
      iterator.next()

    var resourceKey =
      entry.getKey()

    var attribute =
      entry.getValue()

    var id = 'unknown'

    try {
      id =
        String(
          resourceKey.location()
        )
    } catch (error) {
      id =
        'ERROR:' +
        magoAttributeSafeText(
          error
        )
    }

    result.push({
      resourceKey: resourceKey,
      attribute: attribute,
      id: id
    })
  }

  return result
}


// ============================================================
// Attribute 자체 정보
// ============================================================

function magoAttributeClass(attribute) {
  try {
    return String(
      attribute
        .getClass()
        .getName()
    )
  } catch (error) {
    return 'unknown'
  }
}


function magoAttributeDescriptionId(attribute) {
  try {
    return magoAttributeSafeText(
      attribute.getDescriptionId()
    )
  } catch (error) {
    return (
      'ERROR:' +
      magoAttributeSafeText(
        error
      )
    )
  }
}


function magoAttributeDefaultValue(attribute) {
  try {
    return Number(
      attribute.getDefaultValue()
    )
  } catch (error) {
    return 'unknown'
  }
}


function magoAttributeClientSyncable(attribute) {
  try {
    return Boolean(
      attribute.isClientSyncable()
    )
  } catch (error) {
    return 'unknown'
  }
}


// ============================================================
// RangedAttribute 범위
//
// getMinValue/getMaxValue가 없는 Attribute 구현이면 N/A.
// ============================================================

function magoAttributeMinValue(attribute) {
  try {
    return Number(
      attribute.getMinValue()
    )
  } catch (error) {
    return 'N/A'
  }
}


function magoAttributeMaxValue(attribute) {
  try {
    return Number(
      attribute.getMaxValue()
    )
  } catch (error) {
    return 'N/A'
  }
}


// ============================================================
// Holder 획득
//
// ResourceKey로 Holder를 얻는다.
// Attribute 객체를 Registry method에 직접 넣지 않는다.
// ============================================================

function magoAttributeHolder(
  resourceKey
) {
  try {
    var optional =
      $MagoAttributeRegistry
        .getHolder(
          resourceKey
        )

    if (
      optional == null ||
      optional.isEmpty()
    ) {
      return null
    }

    return optional.get()

  } catch (error) {
    return null
  }
}


// ============================================================
// 플레이어 Attribute 정보
//
// AttributeMap#getInstance(holder)를 사용한다.
//
// null:
//   Registry에는 있으나 이 플레이어 EntityType에는
//   AttributeInstance가 붙어 있지 않음.
//
// non-null:
//   실제 플레이어 Attribute로 사용 가능.
// ============================================================

function magoAttributePlayerInfo(
  player,
  resourceKey
) {
  var result = {
    has: 'N/A',
    base: 'N/A',
    value: 'N/A',
    modifiers: 'N/A'
  }

  if (player == null) {
    return result
  }


  try {
    var holder =
      magoAttributeHolder(
        resourceKey
      )

    if (holder == null) {
      result.has = false

      return result
    }


    var attributeMap =
      player.getAttributes()

    var instance =
      attributeMap.getInstance(
        holder
      )


    if (instance == null) {
      result.has = false

      return result
    }


    result.has = true


    try {
      result.base =
        Number(
          instance.getBaseValue()
        )
    } catch (error1) {
      result.base =
        'ERROR:' +
        magoAttributeSafeText(
          error1
        )
    }


    try {
      result.value =
        Number(
          instance.getValue()
        )
    } catch (error2) {
      result.value =
        'ERROR:' +
        magoAttributeSafeText(
          error2
        )
    }


    try {
      result.modifiers =
        Number(
          instance
            .getModifiers()
            .size()
        )
    } catch (error3) {
      result.modifiers =
        'ERROR:' +
        magoAttributeSafeText(
          error3
        )
    }


    return result

  } catch (error) {

    result.has =
      'ERROR:' +
      magoAttributeSafeText(
        error
      )

    return result
  }
}


// ============================================================
// 실행
// ============================================================

function magoRunAttributeDump(ctx) {
  try {

    var player = null

    try {
      player =
        ctx.source.getPlayer()
    } catch (ignored) {
      player = null
    }


    var entries =
      magoAttributeRegistryEntries(
        $MagoAttributeRegistry
      )


    // ID 기준 정렬
    entries.sort(
      function(a, b) {

        if (a.id < b.id) {
          return -1
        }

        if (a.id > b.id) {
          return 1
        }

        return 0
      }
    )


    var namespaceStats = {}

    var playerAttributeCount = 0

    var errorCount = 0

    var i


    magoAttributeLog(
      '============================================================'
    )

    magoAttributeLog(
      'BEGIN' +
      '|version=2' +
      '|registry_size=' +
      entries.length +
      '|player=' +
      (
        player == null
          ? 'CONSOLE_OR_NON_PLAYER'
          : magoAttributeSafeText(
              player
                .getGameProfile()
                .getName()
            )
      )
    )

    magoAttributeLog(
      '============================================================'
    )


    // ========================================================
    // 전체 Attribute 출력
    // ========================================================

    for (
      i = 0;
      i < entries.length;
      i++
    ) {

      var current =
        entries[i]

      var id =
        current.id

      var attribute =
        current.attribute

      var namespace =
        magoAttributeNamespace(
          id
        )

      var playerInfo =
        magoAttributePlayerInfo(
          player,
          current.resourceKey
        )


      if (
        namespaceStats[namespace] == null
      ) {
        namespaceStats[namespace] = {
          total: 0,
          player: 0
        }
      }


      namespaceStats[
        namespace
      ].total++


      if (
        playerInfo.has === true
      ) {
        namespaceStats[
          namespace
        ].player++

        playerAttributeCount++
      }


      if (
        String(id)
          .indexOf('ERROR:') === 0 ||
        String(playerInfo.has)
          .indexOf('ERROR:') === 0
      ) {
        errorCount++
      }


      magoAttributeLog(
        'ATTR' +

        '|id=' +
        id +

        '|namespace=' +
        namespace +

        '|class=' +
        magoAttributeSafeText(
          magoAttributeClass(
            attribute
          )
        ) +

        '|description=' +
        magoAttributeSafeText(
          magoAttributeDescriptionId(
            attribute
          )
        ) +

        '|default=' +
        magoAttributeDefaultValue(
          attribute
        ) +

        '|min=' +
        magoAttributeMinValue(
          attribute
        ) +

        '|max=' +
        magoAttributeMaxValue(
          attribute
        ) +

        '|client_sync=' +
        magoAttributeClientSyncable(
          attribute
        ) +

        '|player_has=' +
        playerInfo.has +

        '|player_base=' +
        playerInfo.base +

        '|player_value=' +
        playerInfo.value +

        '|player_modifiers=' +
        playerInfo.modifiers
      )
    }


    // ========================================================
    // Namespace 통계
    // ========================================================

    magoAttributeLog(
      '============================================================'
    )

    magoAttributeLog(
      'NAMESPACE_SUMMARY_BEGIN'
    )


    var namespaceOrder =
      Object.keys(
        namespaceStats
      )

    namespaceOrder.sort()


    for (
      i = 0;
      i < namespaceOrder.length;
      i++
    ) {

      var currentNamespace =
        namespaceOrder[i]

      var stats =
        namespaceStats[
          currentNamespace
        ]


      magoAttributeLog(
        'NAMESPACE' +

        '|id=' +
        currentNamespace +

        '|total=' +
        stats.total +

        '|player_has=' +
        stats.player
      )
    }


    magoAttributeLog(
      'NAMESPACE_SUMMARY_END'
    )

    magoAttributeLog(
      '============================================================'
    )


    // ========================================================
    // 최종 요약
    // ========================================================

    magoAttributeLog(
      'END' +

      '|registry_total=' +
      entries.length +

      '|player_attribute_total=' +
      (
        player == null
          ? 'N/A'
          : playerAttributeCount
      ) +

      '|errors=' +
      errorCount
    )


    magoAttributeLog(
      '============================================================'
    )


    ctx.source.sendSuccess(
      function() {

        return $MagoComponent.literal(
          '[Mago] Attribute Registry dump v2 완료. ' +
          'Registry ' +
          entries.length +
          '개' +
          (
            player == null
              ? ''
              : ', 플레이어 Attribute ' +
                playerAttributeCount +
                '개'
          ) +
          ', 오류 ' +
          errorCount +
          '개. ' +
          'latest.log에서 MAGO_ATTRIBUTE_DUMP 검색.'
        )
      },
      false
    )


    return 1

  } catch (error) {

    magoAttributeLog(
      'FATAL_ERROR|' +
      magoAttributeSafeText(
        error
      )
    )


    try {
      ctx.source.sendFailure(
        $MagoComponent.literal(
          '[Mago] Attribute dump v2 실패. ' +
          'latest.log의 MAGO_ATTRIBUTE_DUMP 확인.'
        )
      )
    } catch (ignored) {
      // 무시
    }


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

        .literal(
          'mago_dump_attributes'
        )

        .requires(
          function(source) {

            return source.hasPermission(
              2
            )
          }
        )

        .executes(
          function(ctx) {

            return magoRunAttributeDump(
              ctx
            )
          }
        )
    )
  }
)