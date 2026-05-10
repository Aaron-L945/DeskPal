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
    
    // 动画分组配置 (从配置文件加载或使用默认值)
    this.frameGroups = [6, 8, 8, 4, 5, 8, 6, 6, 6];  // 每组帧数量
    this.currentGroupIndex = 0;  // 当前组索引
    this.currentFrameInGroup = 0;  // 组内帧索引
    this.frameCount = 0;
    this.frameDelay = 8;  // 帧延迟
    this.isPaused = false;  // 是否暂停中
    this.pauseCounter = 0;  // 暂停计数器
    this.pauseDuration = 30;  // 暂停帧数
    
    // 宠物大小
    this.size = 120;
    
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
    this.totalFrames = 57;  // 57个帧
    this.loadFrames();
    this.loadConfig();
  }
  
  // 加载配置文件
  async loadConfig() {
    try {
      const response = await fetch('/config.yaml');
      const text = await response.text();
      const config = this.parseYaml(text);
      
      if (config.pet) {
        if (config.pet.frame_groups) {
          this.frameGroups = config.pet.frame_groups;
          // 更新总帧数
          this.totalFrames = this.frameGroups.reduce((a, b) => a + b, 0);
        }
        if (config.pet.pause_duration) {
          this.pauseDuration = config.pet.pause_duration;
        }
        if (config.pet.frame_delay) {
          this.frameDelay = config.pet.frame_delay;
        }
        if (config.pet.size) {
          this.size = config.pet.size;
        }
      }
      console.log('📋 配置加载成功:', this.frameGroups);
    } catch (err) {
      console.log('📋 使用默认配置');
    }
  }
  
  // 简单YAML解析器
  parseYaml(text) {
    const result = {};
    let currentSection = null;
    
    text.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return;
      
      if (trimmed.includes(':')) {
        const [key, value] = trimmed.split(':').map(s => s.trim());
        
        if (!value) {
          currentSection = key;
          result[key] = {};
        } else if (currentSection) {
          if (value.startsWith('[') && value.endsWith(']')) {
            // 解析数组
            const arrayStr = value.slice(1, -1);
            result[currentSection][key] = arrayStr.split(',').map(n => parseInt(n.trim()));
          } else if (!isNaN(value)) {
            result[currentSection][key] = parseInt(value);
          } else {
            result[currentSection][key] = value;
          }
        }
      }
    });
    
    return result;
  }
  
  // 获取当前组的帧数
  getCurrentGroupFrameCount() {
    return this.frameGroups[this.currentGroupIndex];
  }
  
  // 获取当前组在全局帧数组中的起始索引
  getCurrentGroupStartIndex() {
    let startIndex = 0;
    for (let i = 0; i < this.currentGroupIndex; i++) {
      startIndex += this.frameGroups[i];
    }
    return startIndex;
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
    
    if (this.isPaused) {
      // 暂停中，等待暂停结束
      this.pauseCounter++;
      if (this.pauseCounter >= this.pauseDuration) {
        this.isPaused = false;
        this.pauseCounter = 0;
        // 切换到下一组
        this.currentGroupIndex = (this.currentGroupIndex + 1) % this.frameGroups.length;
        this.currentFrameInGroup = 0;
      }
    } else if (this.frameCount >= this.frameDelay) {
      // 播放动画
      this.frameCount = 0;
      this.currentFrameInGroup++;
      
      // 检查是否到达当前组末尾
      if (this.currentFrameInGroup >= this.getCurrentGroupFrameCount()) {
        // 进入暂停
        this.isPaused = true;
        this.currentFrameInGroup = 0;  // 重置组内帧索引
      }
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
  
  // 获取当前帧索引
  getCurrentFrameIndex() {
    return this.getCurrentGroupStartIndex() + this.currentFrameInGroup;
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
    const frameIndex = this.getCurrentFrameIndex();
    if (this.imageLoaded && this.frames[frameIndex]) {
      const halfSize = this.size / 2;
      ctx.drawImage(
        this.frames[frameIndex],
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