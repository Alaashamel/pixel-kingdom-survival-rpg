class World {


    constructor(scene) {

        this.scene = scene;

        this.width = 3000;

        this.height = 3000;

    }



    create() {


        this.scene.physics.world.setBounds(
            0,
            0,
            this.width,
            this.height
        );


        this.scene.cameras.main.setBounds(
            0,
            0,
            this.width,
            this.height
        );


    }


}


export default World;