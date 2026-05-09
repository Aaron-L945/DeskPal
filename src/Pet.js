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
    this.state = 'idle'; // idle, walk, run, jump, sleep, blink, spin
    this.direction = 1; // 1: 右, -1: 左
    
    // 动画
    this.frame = 0;
    this.frameCount = 0;
    this.frameDelay = 20;  // 降低速度
    this.animFPS = 4;
    
    // 宠物大小
    this.size = 120;  // 减小宠物尺寸以便完整显示
    
    // 点击效果
    this.clickEffect = null;
    this.bounceEffect = { active: false, value: 0 };
    
    // 空闲行为计时器
    this.idleTimer = 0;
    this.idleAction = 'none';
    
    // 旋转动画
    this.spinAngle = 0;
    
    // 加载宠物图片 (独立帧)
    this.frames = [];
    this.imageLoaded = false;
    this.totalFrames = 57;  // 57个帧 (frame_0000.png - frame_0056.png)
    this.currentFrameIndex = 0;
    this.loadFrames();
  }
  
  // 加载所有帧
  loadFrames() {
    let loadedCount = 0;
    for (let i = 0; i < this.totalFrames; i++) {
      const img = new Image();
      img.onload = () => {
        loadedCount++;
        if (loadedCount === this.totalFrames) {
          this.imageLoaded = true;
          console.log('🐾 所有帧加载成功!');
        }
      };
      img.onerror = () => {
        console.error('❌ 帧 ' + i + ' 加载失败');
      };
      img.src = `/src/frames/frame_${String(i).padStart(4, '0')}.png`;
      this.frames.push(img);
    }
  }
  
  // 更新宠物状态
  update(screenWidth, screenHeight) {
    // 更新动画帧
    this.frameCount++;
    if (this.frameCount >= this.frameDelay) {
      this.frame = (this.frame + 1) % this.totalFrames;
      this.frameCount = 0;
    }
    
    // 更新旋转角度
    if (this.state === 'spin') {
      this.spinAngle += 15;
    } else {
      this.spinAngle = 0;
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
    
    // 旋转效果
    if (this.state === 'spin') {
      ctx.rotate(this.spinAngle * Math.PI / 180);
    }
    
    // 缩放（朝向）
    ctx.scale(this.direction, 1);
    
    // 眨眼效果 - 缩小高度
    if (this.state === 'blink') {
      ctx.scale(1, 0.3);
    }
    
    // 绘制当前帧
    if (this.imageLoaded && this.frames[this.frame]) {
      const halfSize = this.size / 2;
      ctx.drawImage(
        this.frames[this.frame],
        -halfSize, -halfSize, this.size, this.size
      );
    } else {
      // 图片未加载时显示占位
      ctx.fillStyle = '#FFB6C1';
      ctx.beginPath();
      ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#FFF';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('Loading...', 0, 5);
    }
    
    ctx.restore();
    
    // 绘制点击效果
    if (this.clickEffect) {
      this.drawClickEffect(ctx);
    }
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