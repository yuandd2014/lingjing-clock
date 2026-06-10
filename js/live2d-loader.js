/**
 * Live2D 虚拟形象加载器 - 实时渲染方案
 * 使用 pixi-live2d-display 加载并渲染 Cubism 3+ 模型
 */

(function() {
  'use strict';

  const CONFIG = {
    modelPath: 'assets/live2d/Hiyori/Hiyori.model3.json',
    layerId: 'live2d-layer',
    canvasId: 'live2d-canvas',
  };

  let app = null;
  let model = null;
  let isInitialized = false;
  let resizeTimeout = null;

  async function init() {
    if (isInitialized) return;
    isInitialized = true;

    // 报告加载中 (走 IPC 桥 → 主进程 → splash 本地 LingJingLoader)
    try { window.lingjingLoader && window.lingjingLoader.report('live2d', 'loading'); } catch (e) { /* 静默 */ }

    const canvas = document.getElementById(CONFIG.canvasId);
    if (!canvas) {
      console.error('Live2D canvas not found');
      try { window.lingjingLoader && window.lingjingLoader.report('live2d', 'error', 'canvas 不存在'); } catch (e) {}
      return;
    }

    try {
      // 动态计算 canvas 尺寸
      const { width, height } = getCanvasSize();

      // 创建 PixiJS Application
      app = new PIXI.Application({
        view: canvas,
        width: width,
        height: height,
        backgroundAlpha: 0,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true
      });

      // 加载 Live2D 模型
      model = await PIXI.live2d.Live2DModel.from(CONFIG.modelPath);

      // 添加到舞台
      app.stage.addChild(model);

      // 调整模型大小和位置
      positionModel(model, width, height);

      // 设置交互
      model.eventMode = 'static';
      model.cursor = 'pointer';

      // 点击触发随机动作
      model.on('pointerdown', () => {
        if (model.motion) {
          model.motion('TapBody');
        }
      });

      // 鼠标移动时视线跟随（节流）
      let lastMouseMove = 0;
      const mouseThrottle = 100; // 100ms 节流

      canvas.addEventListener('mousemove', (e) => {
        const now = Date.now();
        if (now - lastMouseMove < mouseThrottle) return;
        lastMouseMove = now;

        if (!model) return;
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width * 2 - 1;
        const y = (e.clientY - rect.top) / rect.height * 2 - 1;

        // 设置视线参数
        if (model.internalModel && model.internalModel.coreModel) {
          model.internalModel.coreModel.setParameterValueById('ParamEyeBallX', x);
          model.internalModel.coreModel.setParameterValueById('ParamEyeBallY', -y);
          model.internalModel.coreModel.setParameterValueById('ParamAngleX', x * 10);
          model.internalModel.coreModel.setParameterValueById('ParamAngleY', -y * 10);
        }
      });

      // 自动播放 Idle 动作
      setInterval(() => {
        if (model && model.motion) {
          model.motion('Idle');
        }
      }, 15000);

      // 窗口大小变化时重新调整
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          if (!app || !model) return;
          const { width, height } = getCanvasSize();
          app.renderer.resize(width, height);
          positionModel(model, width, height);
        }, 200);
      });

      console.log('Live2D model loaded successfully');
      // 报告加载完成 (走 IPC 桥)
      try { window.lingjingLoader && window.lingjingLoader.report('live2d', 'ready'); } catch (e) { /* 静默 */ }

    } catch (error) {
      console.error('Live2D load error:', error);
      // 报告加载失败 (用本地降级 / 隐藏 canvas, 不阻塞主流程, 走 IPC 桥)
      try { window.lingjingLoader && window.lingjingLoader.report('live2d', 'error', error && error.message); } catch (e) {}
      canvas.style.display = 'none';
    }
  }

  function getCanvasSize() {
    return {
      width: window.innerWidth * 0.5,
      height: window.innerHeight * 0.65
    };
  }

  function positionModel(model, width, height) {
    // 调整模型大小 - 让角色填满画布高度
    const scaleY = height / model.height;
    const scale = scaleY * 2.2; // 放大 2.2 倍，确保角色全身可见
    model.scale.set(scale);

    // 向左偏移，底部对齐
    model.x = (width - model.width * scale) / 2 - width * 0.15;
    model.y = height - model.height * scale;
  }

  // 启动
  if (document.readyState === 'loading') {
    window.addEventListener('load', init);
  } else {
    init();
  }
})();
