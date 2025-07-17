export class ParameterManager {
  constructor() {
    this.parameters = {
      buildingDensity: 0.8,
      heightRange: 16,
      roadWidth: 20.5,
      mainRoadWidth: 6,
      mainRoadInterval: 5,
      colorSaturation: 0.5,
      colorBrightness: 0.5,
      renderDistance: 1,
      randomSeed: 12345
    };
    
    this.callbacks = {
      onParameterChange: null,
      onResetCamera: null
    };
    
    this.initControls();
  }

  initControls() {
    // 绑定所有滑块控件 - 只包含当前HTML中存在的控件
    const controls = ['buildingDensity', 'roadWidth'];

    controls.forEach(param => {
      const input = document.getElementById(param);
      const valueSpan = document.getElementById(param + 'Value');
      
      if (input && valueSpan) {
        input.addEventListener('input', (e) => {
          this.parameters[param] = parseFloat(e.target.value);
          valueSpan.textContent = e.target.value;
          this.notifyParameterChange();
        });
      }
    });

    // 绑定随机种子输入
    const seedInput = document.getElementById('randomSeed');
    if (seedInput) {
      seedInput.addEventListener('change', (e) => {
        this.parameters.randomSeed = parseInt(e.target.value);
        this.notifyParameterChange();
      });
    }

    // 绑定随机种子按钮
    const randomizeBtn = document.getElementById('randomizeSeed');
    if (randomizeBtn) {
      randomizeBtn.addEventListener('click', () => {
        this.parameters.randomSeed = Math.floor(Math.random() * 10000);
        seedInput.value = this.parameters.randomSeed;
        this.notifyParameterChange();
      });
    }

    // 绑定重置相机按钮
    const resetCameraBtn = document.getElementById('resetCamera');
    if (resetCameraBtn) {
      resetCameraBtn.addEventListener('click', () => {
        if (this.callbacks.onResetCamera) {
          this.callbacks.onResetCamera();
        }
      });
    }

    // 绑定面板切换按钮
    const toggleBtn = document.getElementById('togglePanel');
    const panel = document.getElementById('controlPanel');
    if (toggleBtn && panel) {
      toggleBtn.addEventListener('click', () => {
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
      });
    }
  }

  notifyParameterChange() {
    if (this.callbacks.onParameterChange) {
      this.callbacks.onParameterChange(this.parameters);
    }
  }

  onParameterChange(callback) {
    this.callbacks.onParameterChange = callback;
  }

  onResetCamera(callback) {
    this.callbacks.onResetCamera = callback;
  }

  getParameters() {
    return { ...this.parameters };
  }

  setParameters(newParams) {
    this.parameters = { ...this.parameters, ...newParams };
    this.updateUI();
  }

  updateUI() {
    // 更新所有UI控件以反映当前参数值
    Object.keys(this.parameters).forEach(param => {
      const input = document.getElementById(param);
      const valueSpan = document.getElementById(param + 'Value');
      
      if (input) {
        input.value = this.parameters[param];
      }
      if (valueSpan) {
        valueSpan.textContent = this.parameters[param];
      }
    });
  }
} 