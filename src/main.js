/**
 * DeskPal - 桌面宠物主入口
 */
import { Pet } from './Pet.js';

class DeskPalApp {
  constructor() {
    this.canvas = document.getElementById('pet-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.pet = null;
    this.isDragging = false;
    this.dragOffset = { x: 0, y: 0 };
    this.isRunning = false;
    
    this.init();
  }
  
  async init() {
    // 设置Canvas尺寸
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
    
    // 创建宠物
    this.pet = new Pet(this.canvas);
    
    // 设置鼠标事件
    this.setupMouseEvents();
    
    // 双击最小化
    this.setupDoubleClick();
    
    // 开始游戏循环
    this.start();
    
    console.log('🐾 DeskPal 已启动!');
  }
  
  resizeCanvas() {
    const container = document.getElementById('app');
    this.canvas.width = container.offsetWidth;
    this.canvas.height = container.offsetHeight;
  }
  
  setupMouseEvents() {
    // 鼠标按下
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      // 检测是否点击宠物
      if (this.pet.onClick(mouseX, mouseY)) {
        this.isDragging = false;
        return;
      }
      
      // 开始拖拽
      this.isDragging = true;
      this.dragOffset.x = mouseX - this.pet.x;
      this.dragOffset.y = mouseY - this.pet.y;
      this.pet.state = 'drag';
    });
    
    // 鼠标移动
    this.canvas.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      
      const rect = this.canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      
      this.pet.x = mouseX - this.dragOffset.x;
      this.pet.y = mouseY - this.dragOffset.y;
      this.pet.targetX = this.pet.x;
      this.pet.targetY = this.pet.y;
    });
    
    // 鼠标释放
    this.canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
      if (this.pet.state === 'drag') {
        this.pet.state = 'idle';
        this.pet.scheduleIdleAction();
      }
    });
    
    // 鼠标离开
    this.canvas.addEventListener('mouseleave', () => {
      this.isDragging = false;
    });
  }
  
  setupDoubleClick() {
    this.canvas.addEventListener('dblclick', async () => {
      // 双击隐藏窗口
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const window = getCurrentWindow();
      await window.hide();
    });
  }
  
  start() {
    this.isRunning = true;
    this.gameLoop();
  }
  
  stop() {
    this.isRunning = false;
  }
  
  gameLoop() {
    if (!this.isRunning) return;
    
    // 清空画布
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 更新宠物状态
    this.pet.update(this.canvas.width, this.canvas.height);
    
    // 绘制宠物
    this.pet.draw();
    
    // 下一帧
    requestAnimationFrame(() => this.gameLoop());
  }
}

// 启动应用
document.addEventListener('DOMContentLoaded', () => {
  new DeskPalApp();
});
