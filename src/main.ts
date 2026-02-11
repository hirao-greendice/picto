import "./style.css";
import Phaser from "phaser";

const GAME_WIDTH = 1280;
const GAME_HEIGHT = 720;
const PLAYER_SPEED = 320;
const PLAYER_JUMP_SPEED = 720;
const PLAYER_EDGE_PADDING = 24;
const PIXEL_TEXTURE_KEY = "pixel";
const PLAYER_TEXTURE_KEY = "player-placeholder";

type MoveKeys = {
  W: Phaser.Input.Keyboard.Key;
  A: Phaser.Input.Keyboard.Key;
  S: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
};

type PlatformDef = {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: number;
};

type RoomDef = {
  label: string;
  bgColor: number;
  tileColor: number;
  groundColor: number;
  topLineColor: number;
  shift: number;
  platforms: PlatformDef[];
  signs?: PlatformDef[];
};

const ROOM_GRID: RoomDef[][] = [
  [
    {
      label: "A-1",
      bgColor: 0xdadada,
      tileColor: 0xeeeeee,
      groundColor: 0x0f5f31,
      topLineColor: 0x20984b,
      shift: 0,
      platforms: [
        { x: 640, y: 696, width: 1280, height: 48, color: 0x0f5f31 },
        { x: 1160, y: 560, width: 26, height: 270, color: 0x0f5f31 },
        { x: 330, y: 492, width: 230, height: 26, color: 0x1d8e47 },
        { x: 640, y: 430, width: 220, height: 26, color: 0x1d8e47 },
      ],
      signs: [{ x: 1180, y: 330, width: 220, height: 120, color: 0x0f5f31 }],
    },
    {
      label: "A-2",
      bgColor: 0xd8d8d8,
      tileColor: 0xededed,
      groundColor: 0x105f32,
      topLineColor: 0x239f4e,
      shift: 80,
      platforms: [
        { x: 640, y: 696, width: 1280, height: 48, color: 0x105f32 },
        { x: 200, y: 540, width: 220, height: 26, color: 0x1f9d4b },
        { x: 550, y: 460, width: 220, height: 26, color: 0x1f9d4b },
        { x: 900, y: 380, width: 220, height: 26, color: 0x1f9d4b },
      ],
    },
    {
      label: "A-3",
      bgColor: 0xdadada,
      tileColor: 0xeeeeee,
      groundColor: 0x0f5f31,
      topLineColor: 0x20984b,
      shift: 140,
      platforms: [
        { x: 640, y: 696, width: 1280, height: 48, color: 0x0f5f31 },
        { x: 160, y: 602, width: 240, height: 24, color: 0x1f9d4b },
        { x: 390, y: 510, width: 160, height: 24, color: 0x1f9d4b },
        { x: 620, y: 418, width: 160, height: 24, color: 0x1f9d4b },
        { x: 850, y: 326, width: 160, height: 24, color: 0x1f9d4b },
      ],
    },
  ],
  [
    {
      label: "B-1",
      bgColor: 0xdadada,
      tileColor: 0xefefef,
      groundColor: 0x0e5b2f,
      topLineColor: 0x21994b,
      shift: 40,
      platforms: [
        { x: 640, y: 696, width: 1280, height: 48, color: 0x0e5b2f },
        { x: 240, y: 430, width: 260, height: 24, color: 0x1f9d4b },
        { x: 690, y: 430, width: 420, height: 24, color: 0x1f9d4b },
        { x: 1080, y: 318, width: 200, height: 24, color: 0x1f9d4b },
      ],
      signs: [{ x: 1040, y: 220, width: 200, height: 100, color: 0x0f5f31 }],
    },
    {
      label: "B-2",
      bgColor: 0xd8d8d8,
      tileColor: 0xededed,
      groundColor: 0x0f5d31,
      topLineColor: 0x249f4f,
      shift: 120,
      platforms: [
        { x: 640, y: 696, width: 1280, height: 48, color: 0x0f5d31 },
        { x: 240, y: 530, width: 300, height: 24, color: 0x1f9d4b },
        { x: 610, y: 460, width: 180, height: 24, color: 0x1f9d4b },
        { x: 910, y: 390, width: 180, height: 24, color: 0x1f9d4b },
      ],
    },
    {
      label: "B-3",
      bgColor: 0xdadada,
      tileColor: 0xefefef,
      groundColor: 0x0e5b2f,
      topLineColor: 0x21994b,
      shift: 180,
      platforms: [
        { x: 640, y: 696, width: 1280, height: 48, color: 0x0e5b2f },
        { x: 260, y: 588, width: 320, height: 24, color: 0x1f9d4b },
        { x: 640, y: 500, width: 320, height: 24, color: 0x1f9d4b },
        { x: 1000, y: 412, width: 320, height: 24, color: 0x1f9d4b },
      ],
      signs: [{ x: 1060, y: 180, width: 210, height: 120, color: 0x0f5f31 }],
    },
  ],
];

class MainScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Sprite;
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private moveKeys!: MoveKeys;
  private spaceKey!: Phaser.Input.Keyboard.Key;
  private roomX = 0;
  private roomY = 1;
  private readonly touchState = {
    left: false,
    right: false,
    jumpPressed: false,
  };
  private backdrop!: Phaser.GameObjects.Graphics;
  private roomLabel!: Phaser.GameObjects.Text;

  constructor() {
    super("main-scene");
  }

  create(): void {
    this.createRuntimeTextures();

    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error("Keyboard input is unavailable.");
    }
    this.cursors = keyboard.createCursorKeys();
    this.moveKeys = keyboard.addKeys("W,A,S,D") as MoveKeys;
    this.spaceKey = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.backdrop = this.add.graphics().setDepth(-20);
    this.platforms = this.physics.add.staticGroup();

    this.player = this.physics.add
      .sprite(140, 560, PLAYER_TEXTURE_KEY)
      .setDepth(10)
      .setCollideWorldBounds(false)
      .setDragX(1600);
    this.player.setSize(34, 74).setOffset(15, 20);

    this.physics.add.collider(this.player, this.platforms);

    this.roomLabel = this.add
      .text(24, 22, "", {
        fontFamily: "Verdana, sans-serif",
        fontSize: "20px",
        color: "#145f33",
      })
      .setDepth(30);

    this.loadRoom(this.roomX, this.roomY);
    this.createTouchControls();
  }

  update(): void {
    this.handleMovement();
    this.checkRoomTransition();
  }

  private createRuntimeTextures(): void {
    const pixel = this.add.graphics().setVisible(false);
    pixel.fillStyle(0xffffff, 1);
    pixel.fillRect(0, 0, 2, 2);
    pixel.generateTexture(PIXEL_TEXTURE_KEY, 2, 2);
    pixel.destroy();

    const character = this.add.graphics().setVisible(false);
    character.fillStyle(0x239f4e, 1);
    character.fillCircle(32, 14, 10);
    character.fillRoundedRect(20, 28, 24, 28, 7);
    character.fillRoundedRect(12, 38, 20, 12, 6);
    character.fillRoundedRect(32, 40, 20, 12, 6);
    character.fillRoundedRect(16, 54, 20, 28, 6);
    character.fillRoundedRect(34, 52, 16, 36, 6);
    character.generateTexture(PLAYER_TEXTURE_KEY, 64, 96);
    character.destroy();
  }

  private handleMovement(): void {
    const moveLeft = this.cursors.left.isDown || this.moveKeys.A.isDown || this.touchState.left;
    const moveRight = this.cursors.right.isDown || this.moveKeys.D.isDown || this.touchState.right;

    const direction = Number(moveRight) - Number(moveLeft);
    this.player.setVelocityX(direction * PLAYER_SPEED);
    if (direction !== 0) {
      this.player.setFlipX(direction < 0);
    }

    const jumpByKey =
      Phaser.Input.Keyboard.JustDown(this.cursors.up) ||
      Phaser.Input.Keyboard.JustDown(this.moveKeys.W) ||
      Phaser.Input.Keyboard.JustDown(this.spaceKey);
    const jumpPressed = jumpByKey || this.consumeTouchJump();

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (jumpPressed && body.blocked.down) {
      this.player.setVelocityY(-PLAYER_JUMP_SPEED);
    }
  }

  private consumeTouchJump(): boolean {
    const pressed = this.touchState.jumpPressed;
    this.touchState.jumpPressed = false;
    return pressed;
  }

  private checkRoomTransition(): void {
    if (this.player.x < -PLAYER_EDGE_PADDING) {
      this.tryTransition(-1, 0);
      return;
    }
    if (this.player.x > GAME_WIDTH + PLAYER_EDGE_PADDING) {
      this.tryTransition(1, 0);
      return;
    }
    if (this.player.y < -PLAYER_EDGE_PADDING) {
      this.tryTransition(0, -1);
      return;
    }
    if (this.player.y > GAME_HEIGHT + PLAYER_EDGE_PADDING) {
      this.tryTransition(0, 1);
    }
  }

  private tryTransition(dx: number, dy: number): void {
    const nextX = this.roomX + dx;
    const nextY = this.roomY + dy;
    const nextRoom = ROOM_GRID[nextY]?.[nextX];

    if (!nextRoom) {
      this.keepPlayerInsideCurrentRoom(dx, dy);
      return;
    }

    this.roomX = nextX;
    this.roomY = nextY;
    this.loadRoom(this.roomX, this.roomY);

    if (dx === -1) {
      this.player.x = GAME_WIDTH - PLAYER_EDGE_PADDING;
    } else if (dx === 1) {
      this.player.x = PLAYER_EDGE_PADDING;
    }

    if (dy === -1) {
      this.player.y = GAME_HEIGHT - 150;
    } else if (dy === 1) {
      this.player.y = 140;
    }

    this.player.setVelocity(0, 0);
  }

  private keepPlayerInsideCurrentRoom(dx: number, dy: number): void {
    if (dx < 0) {
      this.player.x = 0;
    } else if (dx > 0) {
      this.player.x = GAME_WIDTH;
    }

    if (dy < 0) {
      this.player.y = 0;
    } else if (dy > 0) {
      this.player.y = GAME_HEIGHT;
    }

    this.player.setVelocity(0, 0);
  }

  private loadRoom(x: number, y: number): void {
    const room = ROOM_GRID[y]?.[x];
    if (!room) {
      return;
    }

    this.drawBackdrop(room);
    this.platforms.clear(true, true);

    for (const platform of room.platforms) {
      const block = this.platforms
        .create(platform.x, platform.y, PIXEL_TEXTURE_KEY)
        .setDisplaySize(platform.width, platform.height)
        .setOrigin(0.5)
        .setTint(platform.color ?? room.groundColor)
        .refreshBody();
      block.setDepth(5);
    }

    this.roomLabel.setText(`ROOM ${room.label}`);
  }

  private drawBackdrop(room: RoomDef): void {
    this.backdrop.clear();
    this.backdrop.fillStyle(room.bgColor, 1);
    this.backdrop.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    const tileW = 260;
    const tileH = 124;
    const mortar = 16;

    this.backdrop.fillStyle(room.tileColor, 1);
    for (let row = 0; row < 5; row += 1) {
      const y = row * (tileH + mortar);
      const shift = ((row % 2) * 120 + room.shift) % (tileW + mortar);
      for (let x = -shift; x < GAME_WIDTH + tileW; x += tileW + mortar) {
        this.backdrop.fillRect(x, y, tileW, tileH);
      }
    }

    this.backdrop.fillStyle(room.topLineColor, 1);
    this.backdrop.fillRect(0, 664, GAME_WIDTH, 14);

    if (room.signs) {
      for (const sign of room.signs) {
        this.backdrop.fillStyle(0x239f4e, 1);
        this.backdrop.fillRect(sign.x - sign.width / 2, sign.y - sign.height / 2, sign.width, sign.height);
        this.backdrop.fillStyle(sign.color ?? 0x0f5f31, 1);
        this.backdrop.fillRect(
          sign.x - sign.width / 2 + 16,
          sign.y - sign.height / 2 + 16,
          sign.width - 32,
          sign.height - 32,
        );
      }
    }
  }

  private createTouchControls(): void {
    if (this.sys.game.device.os.desktop) {
      return;
    }

    this.createControlButton(110, 632, 58, "<", () => {
      this.touchState.left = true;
    }, () => {
      this.touchState.left = false;
    });

    this.createControlButton(242, 632, 58, ">", () => {
      this.touchState.right = true;
    }, () => {
      this.touchState.right = false;
    });

    this.createControlButton(1160, 628, 64, "JUMP", () => {
      this.touchState.jumpPressed = true;
    });
  }

  private createControlButton(
    x: number,
    y: number,
    radius: number,
    label: string,
    onPress: () => void,
    onRelease?: () => void,
  ): void {
    const button = this.add
      .circle(x, y, radius, 0xffffff, 0.17)
      .setStrokeStyle(4, 0x229d4d, 0.75)
      .setDepth(40)
      .setScrollFactor(0)
      .setInteractive();

    this.add
      .text(x, y, label, {
        fontFamily: "Verdana, sans-serif",
        fontSize: label.length > 2 ? "24px" : "38px",
        color: "#14703a",
      })
      .setDepth(41)
      .setOrigin(0.5)
      .setScrollFactor(0);

    button.on("pointerdown", () => {
      onPress();
    });

    button.on("pointerup", () => {
      onRelease?.();
    });

    button.on("pointerout", () => {
      onRelease?.();
    });
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  parent: "app",
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 1700 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  scene: [MainScene],
});

