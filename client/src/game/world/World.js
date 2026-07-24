class World {
  constructor(scene) {
    this.scene = scene;
    this.width = 5000;
    this.height = 5000;
  }

  create() {
    const ground = this.scene.add.rectangle(
      this.width / 2,
      this.height / 2,
      this.width,
      this.height,
      0x4caf50
    );

    ground.setDepth(0);

    this.scene.physics.add.existing(ground, true);
    ground.body.setSize(this.width, this.height);

    this.scene.physics.world.setBounds(0, 0, this.width, this.height);
  }
}

export default World;
