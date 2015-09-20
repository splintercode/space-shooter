import {Asteroid} from 'app/asteroid';
import {Engine} from 'app/engine/engine';

class AsteroidCollection {
    list: Array<Asteroid>;
    
    constructor() {
        this.list = [];
    }

    update() {
        this.list.forEach((asteroid, index) => {
            if (asteroid.settings.posY > Engine.settings.canvasHeight + 30) {
                this.list.splice(index, 1);
            }
        });
        
        this.list.forEach(asteroid => asteroid.update());
    }

    draw(context) {
        this.list.forEach(asteroid => asteroid.draw(context));
    }

    addAsteroid() {
        this.list.push(new Asteroid());
    }
}

export {AsteroidCollection};