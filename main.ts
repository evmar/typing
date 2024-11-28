import * as PIXI from 'pixi.js';

const leftKeys = 'qwerasdfzxcv';

const app = new PIXI.Application();

function randInt(max: number): number {
  return Math.floor(Math.random() * max);
}

function randNewInt(max: number, avoid: number[]): number {
  for (let i = 0; i < 5; i++) {
    const value = randInt(max);
    if (!avoid.includes(value)) {
      return value;
    }
  }
  return randInt(max);
}

enum SpotState {
  Loading,
  Ready,
  Leaving
}

class TruckSpot {
  height = 66;  // truck height
  state: SpotState = SpotState.Loading;
  view: PIXI.Container;
  letterSprite?: PIXI.Text;
  truckSprite: PIXI.Sprite;

  constructor(public letter: string, public truck: number, public done: () => void) {
    this.view = new PIXI.Container();

    this.truckSprite = PIXI.Sprite.from(PIXI.Assets.get(`truck${truck + 1}`));
    this.truckSprite.scale.set(0.25);
    this.view.addChild(this.truckSprite);

    this.setState(SpotState.Loading);
  }

  setState(state: SpotState) {
    this.state = state;
    switch (state) {
      case SpotState.Loading: {
        this.truckSprite.x = -450;
        const update = (ticker: PIXI.Ticker) => {
          if (this.truckSprite.x >= 50) {
            this.setState(SpotState.Ready);
            ticker.remove(update);
            return;
          }
          this.truckSprite.x += ticker.deltaTime * 4;
        };
        app.ticker.add(update);
        break;
      }

      case SpotState.Ready:
        this.truckSprite.x = 50;
        this.addLetter();
        break;

      case SpotState.Leaving: {
        this.view.removeChild(this.letterSprite!);
        this.letterSprite = undefined;

        let speed = 8;
        const update = (ticker: PIXI.Ticker) => {
          if (this.truckSprite.x >= app.screen.width) {
            this.done();
            ticker.remove(update);
            return;
          }
          this.truckSprite.x += ticker.deltaTime * speed;
          speed += ticker.deltaTime;
        };
        app.ticker.add(update);

        break;
      }
    }
  }

  addLetter() {
    this.letterSprite = new PIXI.Text({ text: this.letter.toUpperCase() });
    this.letterSprite.anchor.set(0.5);
    this.letterSprite.y = (this.height) / 2;

    const update = (ticker: PIXI.Ticker) => {
      if (!this.letterSprite) {
        ticker.remove(update);
        return;
      }
      let scale = 1 + Math.sin(ticker.lastTime / 200) * 0.2;
      this.letterSprite!.scale.set(scale);
    };
    app.ticker.add(update);

    this.view.addChild(this.letterSprite);
  }
}

class State {
  keys: string = leftKeys;
  spots: TruckSpot[] = [];

  newSpot(i: number): TruckSpot {
    let letter: string;
    do {
      letter = this.keys[randInt(this.keys.length)];
    } while (this.spots.some(s => s.letter === letter));

    const truck = randNewInt(4, this.spots.map(s => s.truck));
    const spot = new TruckSpot(letter, truck, () => {
      this.container.removeChild(spot.view);
      this.spots[i] = this.newSpot(i);
    });
    spot.view.x = 100;
    spot.view.y = 100 + i * 200;
    this.container.addChild(spot.view);
    return spot;
  }

  constructor(private container: PIXI.Container) {
    for (let i = 0; i < 3; i++) {
      this.spots.push(this.newSpot(i));
    }
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key.length !== 1) return;
    const letter = e.key[0];
    const spot = this.spots.find(s => s.state === SpotState.Ready && s.letter === letter);
    if (!spot) return;
    spot.setState(SpotState.Leaving);
  }
}

async function main() {
  await app.init({ background: 'white', resizeTo: window });
  document.body.appendChild(app.canvas);

  PIXI.Assets.addBundle('trucks', {
    truck1: 'truck1.png',
    truck2: 'truck2.png',
    truck3: 'truck3.png',
    truck4: 'truck4.png',
  });
  await PIXI.Assets.loadBundle('trucks');

  const state = new State(app.stage);
  window.onkeydown = (e) => {
    state.onKeyDown(e);
  };
}

main();