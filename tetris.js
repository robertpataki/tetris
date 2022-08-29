const DEBUG = true;
const DRAW_GHOST = true;
const TICKER_FREQUENCY = 500;

const BLOCK_SIZE = 40;
const HORIZONTAL_BLOCKS = 10;
const VERTICAL_BLOCKS = 20;
const ARENA_WIDTH = HORIZONTAL_BLOCKS * BLOCK_SIZE;
const ARENA_HEIGHT = VERTICAL_BLOCKS * BLOCK_SIZE;

const COLOURS = {
  ARENA_BG: "#D1D878",
  ARENA_BORDER: "#8A9131",
  BLOCK_FILL: "#8A9038",
  BLOCK_STROKE: "#3C4029"
};
const arena = document.querySelector("#arena");
const debug = document.querySelector("#debug");

const canvas = document.createElement("canvas");
canvas.style.border = `3px solid ${COLOURS.ARENA_BORDER}`;
canvas.width = ARENA_WIDTH * 2;
canvas.height = ARENA_HEIGHT * 2;
canvas.style.width = `${ARENA_WIDTH}px`;
canvas.style.height = `${ARENA_HEIGHT}px`;
arena.appendChild(canvas);
const context = canvas.getContext("2d");
context.scale(2, 2);

const DIRECTIONS = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  DOWN: 'DOWN'
}

let direction = DIRECTIONS.DOWN;

const pitBlocks = [
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1,
  1, 1, 0, 0, 1, 1, 0, 1, 1, 1,
  1, 0, 0, 0, 1, 0, 0, 0, 1, 1,
  1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 
];

const SHAPES = {
  S: [1, 1, 1, 1],
  T: [
    1, 1, 1,
    0, 1, 0, 
    0, 0, 0
  ],
  L: [
    1, 1, 1,
    1, 0, 0,
    0, 0, 0
  ],
  L2: [
    1, 1, 1, 
    0, 0, 1, 
    0, 0, 0
  ],
  _: [
    0, 0, 0, 0,
    1, 1, 1, 1, 
    0, 0, 0, 0, 
    0, 0, 0, 0
  ],
  Z: [
    0, 1, 1,
    1, 1, 0,
    0, 0, 0
  ],
  Z2: [
    1, 1, 0,
    0, 1, 1,
    0, 0, 0
  ]
};

const SHAPES_ARRAY = [
  SHAPES.S,
  SHAPES.T,
  SHAPES.L,
  SHAPES.L2,
  SHAPES._,
  SHAPES.Z,
  SHAPES.Z2
];

const rotateArray = (sourceArray, direction = DIRECTIONS.RIGHT) => {
  const size = Math.sqrt(sourceArray.length);
  if (size % 1 !== 0) {
    return sourceArray;
  }

  const array = new Array(size * size);
  for (let i = 0; i < size; i += 1) {
    for (let j = 0; j < size; j += 1) {
      if (direction === DIRECTIONS.LEFT) {
        array[size * i + j] = sourceArray[size - 1 - i + j * size];
      } else {
        array[size * (i + 1) - (j + 1)] = sourceArray[i + size * j];
      }
    }
  }
  return array;
};

// Collision detection steps
// 1. Find most bottom edges of descending shape
// 2. Below current descending shape xmin-xmax coords find first settled block
// 3. Mark the blocks where descending shape would settle upon collision

let descendingShape;
let ticker = undefined;
const onTick = () => {
  direction = DIRECTIONS.DOWN;
  moveShape(direction);

  if (
    descendingShape.position.y >
    VERTICAL_BLOCKS - descendingShape.props.boxSize
  ) {
    createNewShape();
    startTicker();
  }
  drawGraphics();
};
const resetTicker = () => {
  if (typeof ticker !== "undefind") {
    clearInterval(ticker);
    ticker = undefined;
  }
};
const startTicker = () => {
  resetTicker();
  ticker = setInterval(onTick, TICKER_FREQUENCY);
};

const drawGraphics = () => {
  showDebugInfo();
  drawBackground();
  drawPitShapes();
  if (DRAW_GHOST) {
    drawGhostShape();
  }
  if (descendingShape.shape) {
    drawDescendingShape();
  }
};

const drawGhostShape = () => {};

const drawShapeBlock = ({
  posX,
  posY
}) => {
  const strokeWidth = 4;
  context.fillStyle = COLOURS.BLOCK_STROKE;
  context.fillRect(
    posX,
    posY,
    BLOCK_SIZE,
    BLOCK_SIZE
  );

  context.fillStyle = COLOURS.BLOCK_FILL;
  context.fillRect(
    posX + strokeWidth,
    posY + strokeWidth,
    BLOCK_SIZE - strokeWidth * 2,
    BLOCK_SIZE - strokeWidth * 2
  );

  context.fillStyle = COLOURS.BLOCK_STROKE;
  context.fillRect(
    posX +
    strokeWidth * 2,
    posY +
    strokeWidth * 2,
    BLOCK_SIZE - strokeWidth * 4,
    BLOCK_SIZE - strokeWidth * 4
  );

  context.fillStyle = COLOURS.BLOCK_FILL;
  context.fillRect(
    posX +
    strokeWidth * 4,
    posY +
    strokeWidth * 4,
    BLOCK_SIZE - strokeWidth * 8,
    BLOCK_SIZE - strokeWidth * 8
  );
}

const drawDescendingShape = () => {
  const boxSize = descendingShape.props.boxSize;
  const startPosX = descendingShape.position.x * BLOCK_SIZE;
  const startPosY = descendingShape.position.y * BLOCK_SIZE;

  descendingShape.shape.map((block, index) => {
    if (!!block) {
      drawShapeBlock({
        posX: startPosX + Math.floor(index % boxSize) * BLOCK_SIZE,
        posY: startPosY + Math.floor(index / boxSize) * BLOCK_SIZE
      });
    } else {
      if (DEBUG) {
        context.fillStyle = "rgba(0, 0, 0, 0.2)";
        context.fillRect(
          startPosX + Math.floor(index % boxSize) * BLOCK_SIZE,
          startPosY + Math.floor(index / boxSize) * BLOCK_SIZE,
          BLOCK_SIZE,
          BLOCK_SIZE
        );
      }
    }
    return;
  });
  context.restore();
};

const getGridPosition = ({
  i = 0,
  columns = 10,
  rows = 10
}) => {
  return {
    column: Math.floor(i % rows),
    row: Math.floor(i / columns),
  }
}

const drawPitShapes = () => {
  for (let i = 0; i < pitBlocks.length; i++) {
    const gridPos = getGridPosition({
      i,
      HORIZONTAL_BLOCKS,
      VERTICAL_BLOCKS
    });
    if (!!pitBlocks[i]) {
      drawShapeBlock({
        posX: gridPos.column * BLOCK_SIZE,
        posY: gridPos.row * BLOCK_SIZE
      });
    }
  }
};

const drawBackground = () => {
  const canvasWidth = context.canvas.clientWidth;
  const canvasHeight = context.canvas.clientHeight;
  context.clearRect(0, 0, canvasWidth, canvasHeight);
  context.fillStyle = COLOURS.ARENA_BG;
  context.fillRect(0, 0, canvasWidth, canvasHeight);

  if (DEBUG) {
    context.strokeStyle = "rgba(0, 0, 0, 0.1)";
    context.setLineDash([2, 2]);
    for (let i = 0; i < HORIZONTAL_BLOCKS; i++) {
      context.strokeRect(
        BLOCK_SIZE * i,
        0,
        BLOCK_SIZE,
        BLOCK_SIZE * VERTICAL_BLOCKS
      );
    }

    for (let i = 0; i < VERTICAL_BLOCKS; i++) {
      context.strokeRect(
        0,
        BLOCK_SIZE * i,
        BLOCK_SIZE * HORIZONTAL_BLOCKS,
        BLOCK_SIZE
      );
    }
  }

  context.restore();
};

const rotateShape = (direction) => {
  if (![DIRECTIONS.LEFT, DIRECTIONS.RIGHT].includes(direction)) {
    return;
  }

  descendingShape.shape = rotateArray(descendingShape.shape, direction);
  descendingShape.props = getShapeProps(descendingShape.shape);
};

const moveShape = (direction) => {
  if (![DIRECTIONS.LEFT, DIRECTIONS.RIGHT, DIRECTIONS.DOWN].includes(direction)) {
    return;
  }

  switch (direction) {
    case DIRECTIONS.LEFT:
      descendingShape.position.x =
        descendingShape.position.x > 0 - descendingShape.props.minX ?
        (descendingShape.position.x -= 1) :
        0 - descendingShape.props.minX;
      break
    case DIRECTIONS.RIGHT:
      descendingShape.position.x =
        descendingShape.position.x <
        HORIZONTAL_BLOCKS -
        descendingShape.props.boxSize +
        descendingShape.props.rightGap ?
        (descendingShape.position.x += 1) :
        HORIZONTAL_BLOCKS -
        descendingShape.props.boxSize +
        descendingShape.props.rightGap;
      break
    case DIRECTIONS.DOWN:
      descendingShape.position.y += 1;
      break
  }
}

const handleKeyboard = (e) => {
  if (
    ![
      "ArrowUp",
      "ArrowDown",
      "KeyW",
      "KeyS",
      "ArrowLeft",
      "ArrowRight",
      "KeyA",
      "KeyD",
      "Space",
      "Enter"
    ].includes(e.code)
  ) {
    return;
  }

  e.preventDefault();
  e.stopPropagation();

  switch (e.code) {
    case "ArrowUp":
    case "KeyW":
      rotateShape(DIRECTIONS.RIGHT);
      break;
    case "ArrowDown":
    case "KeyS":
      direction = DIRECTIONS.DOWN;
      moveShape(direction);
      break;
    case "ArrowLeft":
    case "KeyA":
      direction = DIRECTIONS.LEFT;
      moveShape(direction);
      break;
    case "ArrowRight":
    case "KeyD":
      direction = DIRECTIONS.RIGHT;
      moveShape(direction);
      break;
    case "Space":
      //       Drop shape
      direction = DIRECTIONS.DOWN;
      break;
    default:
      start();
      break;
  }

  // In case the shape rotates itself out the arena, move it back within the boundaries
  if (descendingShape.position.x < 0 && descendingShape.props.minX === 0) {
    descendingShape.position.x = 0;
  } else if (
    descendingShape.position.x >
    HORIZONTAL_BLOCKS - descendingShape.props.boxSize + descendingShape.props.rightGap
  ) {
    descendingShape.position.x =
      HORIZONTAL_BLOCKS - descendingShape.props.boxSize + descendingShape.props.rightGap;
  }

  drawGraphics();
};

const start = () => {
  createNewShape();
  drawGraphics();
};

document.addEventListener("keydown", handleKeyboard);

/* Properties of blocks within the shape */
const getShapeProps = (shape) => {
  // Note - shape is always sitting inside a square box
  // boxSize (square root of the total number or blocks)
  // width (the width between the most left and most right blocks)
  // height (the height between the most top and most bottom blocks)
  // minX
  // maxX

  const boxSize = Math.sqrt(shape.length);
  let minX = boxSize;
  let maxX = 0;

  shape.map((block, index) => {
    minX =
      block && index % boxSize < minX ? index % boxSize : minX;
    maxX =
      block && index % boxSize > maxX ?
      index % boxSize :
      maxX;
    return;
  });

  const width = maxX === minX ? 1 : maxX - minX + 1;
  const rightGap = boxSize - width - minX;

  return {
    boxSize,
    width,
    minX,
    maxX,
    rightGap
  };
};

const createNewShape = () => {
  descendingShape = {
    shape: [
      ...SHAPES_ARRAY[Math.round(Math.random() * (SHAPES_ARRAY.length - 1))]
    ],
    position: {
      x: 0,
      y: 0
    },
    colour: undefined
  };

  descendingShape.props = getShapeProps(descendingShape.shape);
};

const showDebugInfo = () => {
  if (descendingShape.props && descendingShape.position) {
    debug.innerHTML = 'DEBUG: [';
    debug.innerHTML += Object.keys(descendingShape.props).map((key) => {
      return ` ${key}: ${descendingShape.props[key]}`
    });
    debug.innerHTML += `, pos: (${descendingShape.position.x}, ${descendingShape.position.y}) `;
    debug.innerHTML += `, direction: ${direction}`;
    debug.innerHTML += ']';
  }
}

createNewShape();
drawGraphics();
startTicker();