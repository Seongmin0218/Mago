// kubejs/server_scripts/mago_farm_block_dump.js
//
// 명령어:
// /mago_dump_farm_blocks
//
// 출력:
// kubejs/exported/mago_farm_blocks.json
//
// 블록 ID, Java 클래스, 기본 상태,
// BlockState 속성 및 허용값, 블록 태그 추출

var $MagoFarmRegistries = Java.loadClass(
  'net.minecraft.core.registries.BuiltInRegistries'
)

var $MagoFarmComponent = Java.loadClass(
  'net.minecraft.network.chat.Component'
)

function magoFarmDumpProperties(block) {
  var properties = {}
  var defaultProperties = {}

  var defaultState = block.defaultBlockState()

  var iterator = block
    .getStateDefinition()
    .getProperties()
    .iterator()

  while (iterator.hasNext()) {
    var property = iterator.next()
    var name = String(property.getName())
    var values = []

    var valueIterator = property
      .getPossibleValues()
      .iterator()

    while (valueIterator.hasNext()) {
      var value = valueIterator.next()

      try {
        values.push(
          String(property.getName(value))
        )
      } catch (error) {
        values.push(String(value))
      }
    }

    properties[name] = values

    var defaultValue = defaultState.getValue(property)

    try {
      defaultProperties[name] = String(
        property.getName(defaultValue)
      )
    } catch (error) {
      defaultProperties[name] = String(defaultValue)
    }
  }

  return {
    properties: properties,
    defaultProperties: defaultProperties
  }
}

function magoFarmDumpTags(registry, block) {
  var tags = []

  var iterator = registry
    .wrapAsHolder(block)
    .tags()
    .iterator()

  while (iterator.hasNext()) {
    var tag = iterator.next()

    tags.push(
      String(tag.location())
    )
  }

  tags.sort()

  return tags
}

function magoFarmRunBlockDump(ctx) {
  var registry = $MagoFarmRegistries.BLOCK

  var blocks = []
  var errors = []
  var namespaceCounts = {}
  var registryTotal = 0

  var outputPath =
    'kubejs/exported/mago_farm_blocks.json'

  try {
    console.info(
      '[MAGO_FARM_DUMP] BEGIN'
    )

    var iterator = registry
      .entrySet()
      .iterator()

    while (iterator.hasNext()) {
      var entry = iterator.next()
      var block = entry.getValue()

      var id = String(
        entry.getKey().location()
      )

      var namespace = id.split(':')[0]

      registryTotal++

      if (namespaceCounts[namespace] == null) {
        namespaceCounts[namespace] = 0
      }

      namespaceCounts[namespace]++

      var data = {
        id: id,
        namespace: namespace,
        block_class: '',
        default_state: '',
        default_properties: {},
        state_properties: {},
        tags: []
      }

      // Java 클래스
      try {
        data.block_class = String(
          block.getClass().getName()
        )
      } catch (error) {
        errors.push({
          id: id,
          stage: 'class',
          error: String(error)
        })
      }

      // BlockState 및 성장 조건 후보
      try {
        data.default_state = String(
          block.defaultBlockState()
        )

        var stateData =
          magoFarmDumpProperties(block)

        data.state_properties =
          stateData.properties

        data.default_properties =
          stateData.defaultProperties

      } catch (error) {
        errors.push({
          id: id,
          stage: 'blockstate',
          error: String(error)
        })
      }

      // 블록 태그
      try {
        data.tags = magoFarmDumpTags(
          registry,
          block
        )
      } catch (error) {
        errors.push({
          id: id,
          stage: 'tags',
          error: String(error)
        })
      }

      blocks.push(data)
    }

    blocks.sort(function(a, b) {
      if (a.id < b.id) {
        return -1
      }

      if (a.id > b.id) {
        return 1
      }

      return 0
    })

    var result = {
      version: 1,
      registry_total: registryTotal,
      dumped_total: blocks.length,
      error_count: errors.length,
      namespace_counts: namespaceCounts,
      blocks: blocks,
      errors: errors
    }

    JsonIO.write(
      outputPath,
      JsonIO.parseRaw(
        JSON.stringify(result)
      )
    )

    console.info(
      '[MAGO_FARM_DUMP] END' +
      '|registry_total=' + registryTotal +
      '|dumped=' + blocks.length +
      '|errors=' + errors.length +
      '|file=' + outputPath
    )

    ctx.source.sendSuccess(
      function() {
        return $MagoFarmComponent.literal(
          '[Mago] 블록 덤프 완료. ' +
          '블록: ' + blocks.length +
          '개 / 오류: ' + errors.length +
          '개 / ' + outputPath
        )
      },
      false
    )

    return 1

  } catch (error) {
    console.error(
      '[MAGO_FARM_DUMP] FATAL_ERROR: ' +
      String(error)
    )

    ctx.source.sendFailure(
      $MagoFarmComponent.literal(
        '[Mago] 블록 덤프 실패. 로그를 확인하세요.'
      )
    )

    return 0
  }
}

ServerEvents.commandRegistry(function(event) {
  event.register(
    event.commands
      .literal('mago_dump_farm_blocks')
      .requires(function(source) {
        return source.hasPermission(2)
      })
      .executes(function(ctx) {
        return magoFarmRunBlockDump(ctx)
      })
  )
})