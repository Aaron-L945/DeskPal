/**
 * 宠物类 - 管理宠物的状态、动画和位置
 */
export class Pet {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    // 位置和移动
    this.x = canvas.width / 2;
    this.y = canvas.height / 2;
    this.targetX = this.x;
    this.targetY = this.y;
    this.speed = 2;
    
    // 状态
    this.state = 'idle'; // idle, walk, run, jump, sleep
    this.direction = 1; // 1: 右, -1: 左
    
    // 动画
    this.frame = 0;
    this.frameCount = 0;
    this.frameDelay = 10;
    this.animFPS = 8;
    
    // 宠物颜色和大小
    this.bodyColor = '#FFB6C1';
    this.eyeColor = '#000';
    this.cheekColor = '#FF69B4';
    this.size = 80;
    
    // 宠物部件相对位置
    this.parts = {
      body: { x: 0, y: 0 },
      head: { x: 0, y: -25 },
      leftEye: { x: -10, y: -30 },
      rightEye: { x: 10, y: -30 },
      leftCheek: { x: -20, y: -20 },
      rightCheek: { x: 20, y: -20 },
      mouth: { x: 0, y: -18 },
      leftEar: { x: -20, y: -45 },
      rightEar: { x: 20, y: -45 }
    };
    
    // 点击效果
    this.clickEffect = null;
    this.bounceEffect = { active: false, value: 0 };
    
    // 空闲行为计时器
    this.idleTimer = 0;
    this.idleAction = 'none';
  }
  
  // 更新宠物状态
  update(screenWidth, screenHeight) {
    // 更新动画帧
    this.frameCount++;
    if (this.frameCount >= this.frameDelay) {
      this.frame = (this.frame + 1) % 4;
      this.frameCount = 0;
    }
    
    // 移动到目标位置
    if (Math.abs(this.x - this.targetX) > this.speed) {
      this.x += Math.sign(this.targetX - this.x) * this.speed;
      this.state = 'walk';
    } else if (Math.abs(this.y - this.targetY) > this.speed) {
      this.y += Math.sign(this.targetY - this.y) * this.speed;
      this.state = 'walk';
    } else if (this.state === 'walk') {
      this.state = 'idle';
      this.scheduleIdleAction();
    }
    
    // 边界检测
    this.x = Math.max(this.size / 2, Math.min(screenWidth - this.size / 2, this.x));
    this.y = Math.max(this.size / 2, Math.min(screenHeight - this.size / 2, this.y));
    
    // 更新点击效果
    if (this.clickEffect) {
      this.clickEffect.life--;
      if (this.clickEffect.life <= 0) {
        this.clickEffect = null;
      }
    }
    
    // 更新弹跳效果
    if (this.bounceEffect.active) {
      this.bounceEffect.value *= 0.9;
      if (this.bounceEffect.value < 0.5) {
        this.bounceEffect.active = false;
        this.bounceEffect.value = 0;
      }
    }
    
    // 空闲行为
    this.idleTimer++;
    if (this.idleTimer > 180 && this.state === 'idle') {
      this.performIdleAction();
    }
  }
  
  // 安排空闲动作
  scheduleIdleAction() {
    this.idleTimer = 0;
    const actions = ['none', 'blink', 'look', 'walk'];
    this.idleAction = actions[Math.floor(Math.random() * actions.length)];
  }
  
  // 执行空闲动作
  performIdleAction() {
    switch (this.idleAction) {
      case 'walk':
        this.wander();
        break;
      case 'blink':
        this.state = 'blink';
        setTimeout(() => {
          if (this.state === 'blink') {
            this.state = 'idle';
            this.scheduleIdleAction();
          }
        }, 200);
        break;
      case 'look':
        this.direction = Math.random() > 0.5 ? 1 : -1;
        break;
    }
  }
  
  // 随机漫步
  wander() {
    const padding = 50;
    const screenWidth = this.canvas.width;
    const screenHeight = this.canvas.height;
    
    this.targetX = padding + Math.random() * (screenWidth - padding * 2);
    this.targetY = padding + Math.random() * (screenHeight - padding * 2);
    this.direction = this.targetX > this.x ? 1 : -1;
  }
  
  // 点击宠物
  onClick(mouseX, mouseY) {
    // 检测是否点击在宠物身上
    const dx = mouseX - this.x;
    const dy = mouseY - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < this.size / 2 + 20) {
      // 播放弹跳动画
      this.bounceEffect = { active: true, value: 10 };
      
      // 创建点击效果
      this.clickEffect = {
        x: mouseX,
        y: mouseY - 30,
        life: 30,
        text: this.getRandomReaction()
      };
      
      // 随机动作
      const actions = ['jump', 'spin'];
      const action = actions[Math.floor(Math.random() * actions.length)];
      
      if (action === 'jump' && this.state !== 'jump') {
        this.state = 'jump';
        this.jump();
      } else if (action === 'spin') {
        this.spin();
      }
      
      return true;
    }
    return false;
  }
  
  // 跳跃动作
  jump() {
    let jumpHeight = 20;
    let jumpCount = 0;
    const jumpInterval = setInterval(() => {
      jumpCount++;
      if (jumpCount % 2 === 0) {
        this.bounceEffect = { active: true, value: jumpHeight };
        jumpHeight *= 0.7;
      }
      if (jumpCount >= 8) {
        clearInterval(jumpInterval);
        this.state = 'idle';
        this.scheduleIdleAction();
      }
    }, 100);
  }
  
  // 旋转动作
  spin() {
    this.state = 'spin';
    let spins = 0;
    const spinInterval = setInterval(() => {
      this.direction *= -1;
      spins++;
      if (spins >= 4) {
        clearInterval(spinInterval);
        this.state = 'idle';
        this.scheduleIdleAction();
      }
    }, 100);
  }
  
  // 获取随机反应文字
  getRandomReaction() {
    const reactions = ['Hello!', '♥', 'Hi~', '♪', '(◕ᴗ◕)', 'Woof!'];
    return reactions[Math.floor(Math.random() * reactions.length)];
  }
  
  // 绘制宠物
  draw() {
    const ctx = this.ctx;
    ctx.save();
    
    // 应用弹跳效果
    const bounce = this.bounceEffect.active ? this.bounceEffect.value : 0;
    
    // 居中绘制
    ctx.translate(this.x, this.y - bounce);
    
    // 缩放（朝向）
    ctx.scale(this.direction, 1);
    
    // 绘制身体
    this.drawBody(ctx);
    
    // 绘制头部
    this.drawHead(ctx);
    
    // 绘制眼睛
    this.drawEyes(ctx);
    
    // 绘制腮红
    this.drawCheeks(ctx);
    
    // 绘制嘴巴
    this.drawMouth(ctx);
    
    // 绘制耳朵
    this.drawEars(ctx);
    
    ctx.restore();
    
    // 绘制点击效果
    if (this.clickEffect) {
      this.drawClickEffect(ctx);
    }
  }
  
  // 绘制身体
  drawBody(ctx) {
    const bounce = this.bounceEffect.active ? Math.sin(this.bounceEffect.value * 0.5) * 2 : 0;
    
    ctx.fillStyle = this.bodyColor;
    ctx.beginPath();
    ctx.ellipse(0, 10 + bounce, 35, 30, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 肚子
    ctx.fillStyle = '#FFF0F5';
    ctx.beginPath();
    ctx.ellipse(0, 15 + bounce, 20, 18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 绘制头部
  drawHead(ctx) {
    const bounce = this.bounceEffect.active ? Math.sin(this.bounceEffect.value * 0.3) : 0;
    
    ctx.fillStyle = this.bodyColor;
    ctx.beginPath();
    ctx.arc(0, -20 + bounce, 30, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 绘制眼睛
  drawEyes(ctx) {
    const eyeY = -25;
    const eyeSize = 5;
    
    // 眨眼效果
    let eyeHeight = eyeSize;
    if (this.state === 'blink') {
      eyeHeight = 1;
    }
    
    ctx.fillStyle = this.eyeColor;
    
    // 左眼
    ctx.beginPath();
    ctx.ellipse(-10, eyeY, eyeSize, eyeHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 右眼
    ctx.beginPath();
    ctx.ellipse(10, eyeY, eyeSize, eyeHeight, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 眼睛高光
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(-8, eyeY - 2, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(12, eyeY - 2, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 绘制腮红
  drawCheeks(ctx) {
    ctx.fillStyle = this.cheekColor;
    ctx.globalAlpha = 0.5;
    
    ctx.beginPath();
    ctx.ellipse(-20, -15, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.beginPath();
    ctx.ellipse(20, -15, 8, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.globalAlpha = 1;
  }
  
  // 绘制嘴巴
  drawMouth(ctx) {
    ctx.strokeStyle = this.eyeColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(-5, -12);
    ctx.quadraticCurveTo(0, -8, 5, -12);
    ctx.stroke();
  }
  
  // 绘制耳朵
  drawEars(ctx) {
    ctx.fillStyle = this.bodyColor;
    
    // 左耳
    ctx.beginPath();
    ctx.moveTo(-25, -35);
    ctx.lineTo(-35, -55);
    ctx.lineTo(-15, -40);
    ctx.closePath();
    ctx.fill();
    
    // 右耳
    ctx.beginPath();
    ctx.moveTo(25, -35);
    ctx.lineTo(35, -55);
    ctx.lineTo(15, -40);
    ctx.closePath();
    ctx.fill();
    
    // 耳朵内部
    ctx.fillStyle = this.cheekColor;
    ctx.globalAlpha = 0.5;
    
    ctx.beginPath();
    ctx.moveTo(-25, -38);
    ctx.lineTo(-30, -50);
    ctx.lineTo(-18, -42);
    ctx.closePath();
    ctx.fill();
    
    ctx.beginPath();
    ctx.moveTo(25, -38);
    ctx.lineTo(30, -50);
    ctx.lineTo(18, -42);
    ctx.closePath();
    ctx.fill();
    
    ctx.globalAlpha = 1;
  }
  
  // 绘制点击效果
  drawClickEffect(ctx) {
    const effect = this.clickEffect;
    const alpha = effect.life / 30;
    const y = effect.y - (30 - effect.life);
    
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(effect.text, effect.x, y);
    ctx.restore();
  }
}
