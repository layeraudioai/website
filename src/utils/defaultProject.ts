import { ProjectData } from '../types/logic';
import { VisualElement } from '../types/editor';

export const MULTITHREADED_WORKER_PROJECT: ProjectData = {
  id: 'multithreaded-worker-demo',
  name: 'Worker Thread & Class Benchmark',
  description: 'Visual UI bound to reactive variables, an ES6 Benchmark class, and a background Web Worker calculating primes.',
  customCSS: `
.glow-card {
  box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.1), 0 8px 10px -6px rgba(59, 130, 246, 0.1);
}
.pulse-indicator {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}
`,
  variables: [
    {
      id: 'var-1',
      name: 'primesFound',
      type: 'number',
      value: 0,
      defaultValue: 0,
      description: 'Total number of prime numbers calculated by background worker thread',
    },
    {
      id: 'var-2',
      name: 'maxNumber',
      type: 'number',
      value: 500000,
      defaultValue: 500000,
      description: 'Upper bound limit for the prime number sieve',
    },
    {
      id: 'var-3',
      name: 'threadStatus',
      type: 'string',
      value: 'Ready',
      defaultValue: 'Ready',
      description: 'Live status of the background Web Worker thread',
    },
    {
      id: 'var-4',
      name: 'elapsedMs',
      type: 'number',
      value: 0,
      defaultValue: 0,
      description: 'Worker thread execution time in milliseconds',
    },
    {
      id: 'var-5',
      name: 'runsCompleted',
      type: 'number',
      value: 0,
      defaultValue: 0,
      description: 'Number of benchmark runs managed by BenchmarkTracker class',
    },
    {
      id: 'var-6',
      name: 'lastPrime',
      type: 'number',
      value: 0,
      defaultValue: 0,
      description: 'Highest prime number found in the latest calculation',
    }
  ],
  functions: [
    {
      id: 'func-1',
      name: 'startWorkerJob',
      params: [],
      code: `// Dispatches computation payload to dedicated Web Worker thread
state.threadStatus = 'Worker Computing in Background...';
state.primesFound = 'Calculating...';
state.elapsedMs = '...';

// Send task message to worker thread
workers.primeWorker.postMessage({
  command: 'sievePrimes',
  max: Number(state.maxNumber) || 100000
});

// Notify tracker class instance
classes.tracker.recordRunStart();`,
      description: 'Sends calculation parameters to background worker thread and updates UI state',
    },
    {
      id: 'func-2',
      name: 'resetAllState',
      params: [],
      code: `// Reset all state variables to defaults
state.primesFound = 0;
state.elapsedMs = 0;
state.lastPrime = 0;
state.threadStatus = 'Reset to Ready';
classes.tracker.reset();
state.runsCompleted = classes.tracker.totalRuns;`,
      description: 'Resets counters and tracker class state',
    },
    {
      id: 'func-3',
      name: 'formatElapsed',
      params: ['ms'],
      code: `if (typeof ms !== 'number') return '0 ms';
return ms.toFixed(1) + ' ms (' + (ms / 1000).toFixed(3) + 's)';`,
      description: 'Formats milliseconds into human-readable duration',
    }
  ],
  classes: [
    {
      id: 'class-1',
      name: 'BenchmarkTracker',
      instanceName: 'tracker',
      constructorParams: ['initialRuns'],
      constructorCode: `this.totalRuns = initialRuns || 0;
this.history = [];
this.startTime = 0;`,
      properties: [
        { name: 'totalRuns', type: 'number', initialValue: 0 },
        { name: 'history', type: 'array', initialValue: [] },
      ],
      methods: [
        {
          id: 'meth-1',
          name: 'recordRunStart',
          params: [],
          code: `this.totalRuns += 1;
this.startTime = performance.now();
if (window.appState) {
  window.appState.runsCompleted = this.totalRuns;
}`,
          description: 'Records that a benchmark run has started and increments run counter',
        },
        {
          id: 'meth-2',
          name: 'recordRunEnd',
          params: ['durationMs', 'primesFound'],
          code: `this.history.push({
  runNumber: this.totalRuns,
  duration: durationMs,
  primes: primesFound,
  timestamp: new Date().toLocaleTimeString()
});
console.log('Class [BenchmarkTracker] updated run history:', this.history);`,
          description: 'Saves run metrics into the class history array',
        },
        {
          id: 'meth-3',
          name: 'reset',
          params: [],
          code: `this.totalRuns = 0;
this.history = [];`,
          description: 'Clears history and run counters',
        }
      ],
      description: 'ES6 class instance that manages session metrics and run history',
    }
  ],
  workers: [
    {
      id: 'worker-1',
      name: 'primeWorker',
      instanceName: 'primeWorker',
      description: 'Dedicated Web Worker thread running Prime Number Sieve (non-blocking CPU load)',
      scriptCode: `// Dedicated Web Worker Script
// Runs in a separate background thread!
self.onmessage = function(e) {
  const data = e.data;
  if (data.command === 'sievePrimes') {
    const max = data.max || 100000;
    const start = performance.now();
    
    // Sieve of Eratosthenes algorithm in worker thread
    const sieve = new Uint8Array(max + 1);
    let count = 0;
    let highestPrime = 2;
    
    for (let i = 2; i * i <= max; i++) {
      if (sieve[i] === 0) {
        for (let j = i * i; j <= max; j += i) {
          sieve[j] = 1;
        }
      }
    }
    
    for (let i = 2; i <= max; i++) {
      if (sieve[i] === 0) {
        count++;
        highestPrime = i;
      }
    }
    
    const elapsed = performance.now() - start;
    
    // Post result back to the main browser thread
    self.postMessage({
      status: 'success',
      primesCount: count,
      highestPrime: highestPrime,
      elapsedMs: elapsed,
      maxChecked: max
    });
  }
};`,
      onMessageCode: `// Handler executed in main thread when worker posts message back
const res = event.data;
if (res.status === 'success') {
  state.primesFound = res.primesCount;
  state.lastPrime = res.highestPrime;
  state.elapsedMs = Math.round(res.elapsedMs * 10) / 10;
  state.threadStatus = 'Worker Completed ✓';
  
  // Update class instance
  classes.tracker.recordRunEnd(res.elapsedMs, res.primesCount);
}`,
      autoStart: true,
    }
  ],
  rootElement: {
    id: 'root-container',
    tag: 'div',
    name: 'Main App Shell',
    classes: 'min-h-screen bg-slate-900 text-slate-100 p-6 md:p-10 font-sans flex flex-col items-center justify-start',
    styles: {},
    attributes: {},
    content: '',
    bindings: {},
    children: [
      {
        id: 'header-section',
        tag: 'header',
        name: 'Header Banner',
        classes: 'w-full max-w-4xl mb-8 text-center',
        styles: {},
        attributes: {},
        content: '',
        bindings: {},
        children: [
          {
            id: 'app-title',
            tag: 'h1',
            name: 'App Title',
            classes: 'text-3xl md:text-4xl font-extrabold tracking-tight text-white mb-2',
            styles: {},
            attributes: {},
            content: 'Multi-Threaded Worker & Class Engine',
            bindings: {},
            children: []
          },
          {
            id: 'app-subtitle',
            tag: 'p',
            name: 'App Subtitle',
            classes: 'text-slate-400 text-sm md:text-base max-w-2xl mx-auto',
            styles: {},
            attributes: {},
            content: 'A high-performance visual application with UI fields pointed directly to Web Worker threads, reactive state variables, and ES6 classes.',
            bindings: {},
            children: []
          }
        ]
      },
      {
        id: 'status-card',
        tag: 'div',
        name: 'Worker Status Card',
        classes: 'w-full max-w-4xl bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 mb-8 backdrop-blur-sm shadow-xl',
        styles: {},
        attributes: {},
        content: '',
        bindings: {},
        children: [
          {
            id: 'status-row',
            tag: 'div',
            name: 'Status Header Row',
            classes: 'flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-700/60',
            styles: {},
            attributes: {},
            content: '',
            bindings: {},
            children: [
              {
                id: 'worker-label-group',
                tag: 'div',
                name: 'Worker Label Group',
                classes: 'flex items-center space-x-3',
                styles: {},
                attributes: {},
                content: '',
                bindings: {},
                children: [
                  {
                    id: 'pulse-dot',
                    tag: 'span',
                    name: 'Pulse Dot',
                    classes: 'h-3 w-3 rounded-full bg-emerald-400 pulse-indicator',
                    styles: {},
                    attributes: {},
                    content: '',
                    bindings: {},
                    children: []
                  },
                  {
                    id: 'worker-tag-text',
                    tag: 'span',
                    name: 'Worker Thread Label',
                    classes: 'text-xs uppercase tracking-wider font-semibold text-slate-400',
                    styles: {},
                    attributes: {},
                    content: 'Active Thread: primeWorker.js',
                    bindings: {},
                    children: []
                  }
                ]
              },
              {
                id: 'status-badge',
                tag: 'span',
                name: 'Thread Status Badge',
                classes: 'px-3 py-1 text-xs font-medium rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30',
                styles: {},
                attributes: {},
                content: 'Ready',
                bindings: {
                  textBinding: {
                    sourceType: 'variable',
                    targetId: 'threadStatus'
                  }
                },
                children: []
              }
            ]
          },
          {
            id: 'metrics-grid',
            tag: 'div',
            name: 'Metrics Grid',
            classes: 'grid grid-cols-2 md:grid-cols-4 gap-4 mt-6',
            styles: {},
            attributes: {},
            content: '',
            bindings: {},
            children: [
              {
                id: 'metric-box-1',
                tag: 'div',
                name: 'Primes Found Metric',
                classes: 'bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center',
                styles: {},
                attributes: {},
                content: '',
                bindings: {},
                children: [
                  {
                    id: 'metric-1-label',
                    tag: 'p',
                    name: 'Metric 1 Label',
                    classes: 'text-xs text-slate-400 font-medium',
                    styles: {},
                    attributes: {},
                    content: 'Primes Discovered',
                    bindings: {},
                    children: []
                  },
                  {
                    id: 'metric-1-val',
                    tag: 'h3',
                    name: 'Primes Value Field',
                    classes: 'text-2xl md:text-3xl font-bold text-emerald-400 mt-1',
                    styles: {},
                    attributes: {},
                    content: '0',
                    bindings: {
                      textBinding: {
                        sourceType: 'variable',
                        targetId: 'primesFound'
                      }
                    },
                    children: []
                  }
                ]
              },
              {
                id: 'metric-box-2',
                tag: 'div',
                name: 'Elapsed Time Metric',
                classes: 'bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center',
                styles: {},
                attributes: {},
                content: '',
                bindings: {},
                children: [
                  {
                    id: 'metric-2-label',
                    tag: 'p',
                    name: 'Metric 2 Label',
                    classes: 'text-xs text-slate-400 font-medium',
                    styles: {},
                    attributes: {},
                    content: 'Thread Latency (ms)',
                    bindings: {},
                    children: []
                  },
                  {
                    id: 'metric-2-val',
                    tag: 'h3',
                    name: 'Elapsed Value Field',
                    classes: 'text-2xl md:text-3xl font-bold text-cyan-400 mt-1',
                    styles: {},
                    attributes: {},
                    content: '0 ms',
                    bindings: {
                      textBinding: {
                        sourceType: 'variable',
                        targetId: 'elapsedMs'
                      }
                    },
                    children: []
                  }
                ]
              },
              {
                id: 'metric-box-3',
                tag: 'div',
                name: 'Highest Prime Metric',
                classes: 'bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center',
                styles: {},
                attributes: {},
                content: '',
                bindings: {},
                children: [
                  {
                    id: 'metric-3-label',
                    tag: 'p',
                    name: 'Metric 3 Label',
                    classes: 'text-xs text-slate-400 font-medium',
                    styles: {},
                    attributes: {},
                    content: 'Highest Prime',
                    bindings: {},
                    children: []
                  },
                  {
                    id: 'metric-3-val',
                    tag: 'h3',
                    name: 'Highest Prime Field',
                    classes: 'text-2xl md:text-3xl font-bold text-amber-400 mt-1',
                    styles: {},
                    attributes: {},
                    content: '0',
                    bindings: {
                      textBinding: {
                        sourceType: 'variable',
                        targetId: 'lastPrime'
                      }
                    },
                    children: []
                  }
                ]
              },
              {
                id: 'metric-box-4',
                tag: 'div',
                name: 'Class Runs Metric',
                classes: 'bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-center',
                styles: {},
                attributes: {},
                content: '',
                bindings: {},
                children: [
                  {
                    id: 'metric-4-label',
                    tag: 'p',
                    name: 'Metric 4 Label',
                    classes: 'text-xs text-slate-400 font-medium',
                    styles: {},
                    attributes: {},
                    content: 'Tracker Class Runs',
                    bindings: {},
                    children: []
                  },
                  {
                    id: 'metric-4-val',
                    tag: 'h3',
                    name: 'Runs Value Field',
                    classes: 'text-2xl md:text-3xl font-bold text-purple-400 mt-1',
                    styles: {},
                    attributes: {},
                    content: '0',
                    bindings: {
                      textBinding: {
                        sourceType: 'variable',
                        targetId: 'runsCompleted'
                      }
                    },
                    children: []
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        id: 'controls-card',
        tag: 'div',
        name: 'Execution Controls',
        classes: 'w-full max-w-4xl bg-slate-800/80 border border-slate-700/80 rounded-2xl p-6 mb-8 backdrop-blur-sm shadow-xl',
        styles: {},
        attributes: {},
        content: '',
        bindings: {},
        children: [
          {
            id: 'controls-title',
            tag: 'h2',
            name: 'Controls Title',
            classes: 'text-lg font-semibold text-white mb-4 flex items-center gap-2',
            styles: {},
            attributes: {},
            content: 'Benchmark Configuration & Triggers',
            bindings: {},
            children: []
          },
          {
            id: 'form-row',
            tag: 'div',
            name: 'Form Inputs Row',
            classes: 'flex flex-col sm:flex-row items-center gap-4',
            styles: {},
            attributes: {},
            content: '',
            bindings: {},
            children: [
              {
                id: 'input-group',
                tag: 'div',
                name: 'Number Input Container',
                classes: 'w-full sm:flex-1',
                styles: {},
                attributes: {},
                content: '',
                bindings: {},
                children: [
                  {
                    id: 'input-label',
                    tag: 'label',
                    name: 'Input Field Label',
                    classes: 'block text-xs font-medium text-slate-400 mb-1',
                    styles: {},
                    attributes: {},
                    content: 'Search Upper Bound (Sieve Limit)',
                    bindings: {},
                    children: []
                  },
                  {
                    id: 'number-input',
                    tag: 'input',
                    name: 'Bound Number Input',
                    classes: 'w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500 text-sm font-mono',
                    styles: {},
                    attributes: {
                      type: 'number',
                      min: '1000',
                      max: '5000000',
                      step: '10000',
                      value: '500000'
                    },
                    content: '',
                    bindings: {
                      attributeBindings: [
                        {
                          id: 'attr-bind-1',
                          attributeName: 'value',
                          sourceType: 'variable',
                          targetId: 'maxNumber'
                        }
                      ],
                      eventBindings: [
                        {
                          id: 'evt-bind-input',
                          eventName: 'input',
                          actionType: 'setVariable',
                          targetId: 'maxNumber',
                          payloadExpr: 'Number($event.target.value)'
                        }
                      ]
                    },
                    children: []
                  }
                ]
              },
              {
                id: 'btn-trigger-worker',
                tag: 'button',
                name: 'Start Worker Button',
                classes: 'w-full sm:w-auto px-6 py-2.5 mt-5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white font-medium rounded-lg shadow-lg shadow-indigo-600/25 transition cursor-pointer flex items-center justify-center gap-2 text-sm',
                styles: {},
                attributes: {},
                content: '▶ Dispatch to Worker Thread',
                bindings: {
                  eventBindings: [
                    {
                      id: 'evt-bind-1',
                      eventName: 'click',
                      actionType: 'callFunction',
                      targetId: 'startWorkerJob'
                    }
                  ]
                },
                children: []
              },
              {
                id: 'btn-reset',
                tag: 'button',
                name: 'Reset Button',
                classes: 'w-full sm:w-auto px-5 py-2.5 mt-5 bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-200 font-medium rounded-lg transition cursor-pointer text-sm',
                styles: {},
                attributes: {},
                content: '↺ Reset State',
                bindings: {
                  eventBindings: [
                    {
                      id: 'evt-bind-2',
                      eventName: 'click',
                      actionType: 'callFunction',
                      targetId: 'resetAllState'
                    }
                  ]
                },
                children: []
              }
            ]
          }
        ]
      },
      {
        id: 'footer-notes',
        tag: 'footer',
        name: 'Footer Documentation',
        classes: 'w-full max-w-4xl text-center text-xs text-slate-500 mt-auto pt-6 border-t border-slate-800/80',
        styles: {},
        attributes: {},
        content: 'Interactive Browser Visual Editor • Variables, Functions, Classes, and Web Workers point directly to UI components.',
        bindings: {},
        children: []
      }
    ]
  }
};

export const SHOPPING_CART_PROJECT: ProjectData = {
  id: 'shopping-cart-class-demo',
  name: 'E-Commerce Cart & Class Engine',
  description: 'UI pointed to an ES6 ShoppingCart class instance, reactive currency formatting, and state items.',
  customCSS: '',
  variables: [
    {
      id: 'sc-var-1',
      name: 'cartCount',
      type: 'number',
      value: 2,
      defaultValue: 2,
      description: 'Total items in cart',
    },
    {
      id: 'sc-var-2',
      name: 'cartTotal',
      type: 'number',
      value: 148,
      defaultValue: 148,
      description: 'Total cart balance ($)',
    },
    {
      id: 'sc-var-3',
      name: 'couponCode',
      type: 'string',
      value: '',
      defaultValue: '',
      description: 'User entered coupon code',
    },
    {
      id: 'sc-var-4',
      name: 'discountMessage',
      type: 'string',
      value: 'Apply code SAVE20 for 20% off!',
      defaultValue: 'Apply code SAVE20 for 20% off!',
      description: 'Coupon status feedback',
    }
  ],
  functions: [
    {
      id: 'sc-func-1',
      name: 'applyCoupon',
      params: [],
      code: `if (state.couponCode.toUpperCase() === 'SAVE20') {
  classes.cart.discountRate = 0.2;
  state.discountMessage = '✓ 20% Discount applied!';
  state.cartTotal = classes.cart.getTotal();
} else {
  state.discountMessage = '❌ Invalid coupon code. Try SAVE20';
}`,
      description: 'Applies discount coupon to cart instance',
    },
    {
      id: 'sc-func-2',
      name: 'addSampleItem',
      params: ['title', 'price'],
      code: `classes.cart.addItem(title || 'Studio Headphones', price || 89);
state.cartCount = classes.cart.getItemCount();
state.cartTotal = classes.cart.getTotal();`,
      description: 'Adds an item to the shopping cart class instance',
    },
    {
      id: 'sc-func-3',
      name: 'clearCart',
      params: [],
      code: `classes.cart.clear();
state.cartCount = 0;
state.cartTotal = 0;
state.discountMessage = 'Cart cleared';`,
      description: 'Empties shopping cart',
    }
  ],
  classes: [
    {
      id: 'sc-class-1',
      name: 'ShoppingCart',
      instanceName: 'cart',
      constructorParams: [],
      constructorCode: `this.items = [
  { id: 1, name: 'Mechanical Keyboard', price: 99 },
  { id: 2, name: 'Ergonomic Mouse', price: 49 }
];
this.discountRate = 0;`,
      properties: [
        { name: 'discountRate', type: 'number', initialValue: 0 },
      ],
      methods: [
        {
          id: 'sc-meth-1',
          name: 'addItem',
          params: ['name', 'price'],
          code: `this.items.push({ id: Date.now(), name: name, price: Number(price) });`,
          description: 'Adds item to cart collection',
        },
        {
          id: 'sc-meth-2',
          name: 'getTotal',
          params: [],
          code: `const subtotal = this.items.reduce((sum, item) => sum + item.price, 0);
return Math.round(subtotal * (1 - this.discountRate));`,
          description: 'Calculates discounted total',
        },
        {
          id: 'sc-meth-3',
          name: 'getItemCount',
          params: [],
          code: `return this.items.length;`,
          description: 'Returns total quantity of items',
        },
        {
          id: 'sc-meth-4',
          name: 'clear',
          params: [],
          code: `this.items = [];
this.discountRate = 0;`,
          description: 'Clears all items',
        }
      ],
      description: 'ES6 Cart Controller managing items and totals',
    }
  ],
  workers: [
    {
      id: 'sc-worker-1',
      name: 'taxCalculatorWorker',
      instanceName: 'taxWorker',
      description: 'Web worker calculating region-specific sales tax in background thread',
      scriptCode: `self.onmessage = function(e) {
  const { subtotal, stateCode } = e.data;
  const rates = { CA: 0.0825, NY: 0.08875, TX: 0.0625, FL: 0.06 };
  const rate = rates[stateCode] || 0.05;
  const tax = subtotal * rate;
  self.postMessage({ stateCode, rate, tax, finalTotal: subtotal + tax });
};`,
      onMessageCode: `console.log('Worker tax calculation:', event.data);`,
    }
  ],
  rootElement: {
    id: 'sc-root',
    tag: 'div',
    name: 'Cart Shell',
    classes: 'min-h-screen bg-neutral-900 text-neutral-100 p-8 flex flex-col items-center justify-start',
    styles: {},
    attributes: {},
    content: '',
    bindings: {},
    children: [
      {
        id: 'sc-header',
        tag: 'header',
        name: 'Store Header',
        classes: 'w-full max-w-2xl flex justify-between items-center mb-8 border-b border-neutral-800 pb-4',
        styles: {},
        attributes: {},
        content: '',
        bindings: {},
        children: [
          {
            id: 'sc-store-name',
            tag: 'h1',
            name: 'Store Brand',
            classes: 'text-2xl font-bold text-white',
            styles: {},
            attributes: {},
            content: 'HyperGear Audio',
            bindings: {},
            children: []
          },
          {
            id: 'sc-badge',
            tag: 'div',
            name: 'Cart Count Badge',
            classes: 'px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-semibold',
            styles: {},
            attributes: {},
            content: '2 Items in Cart',
            bindings: {
              textBinding: {
                sourceType: 'variable',
                targetId: 'cartCount',
                format: 'number'
              }
            },
            children: []
          }
        ]
      },
      {
        id: 'sc-card',
        tag: 'div',
        name: 'Checkout Box',
        classes: 'w-full max-w-2xl bg-neutral-800 border border-neutral-700 rounded-2xl p-6 shadow-2xl',
        styles: {},
        attributes: {},
        content: '',
        bindings: {},
        children: [
          {
            id: 'sc-total-row',
            tag: 'div',
            name: 'Total Display Row',
            classes: 'flex justify-between items-baseline mb-6 pb-4 border-b border-neutral-700',
            styles: {},
            attributes: {},
            content: '',
            bindings: {},
            children: [
              {
                id: 'sc-total-label',
                tag: 'span',
                name: 'Total Label',
                classes: 'text-lg text-neutral-300',
                styles: {},
                attributes: {},
                content: 'Total Balance:',
                bindings: {},
                children: []
              },
              {
                id: 'sc-total-val',
                tag: 'h2',
                name: 'Total Value Element',
                classes: 'text-4xl font-extrabold text-emerald-400',
                styles: {},
                attributes: {},
                content: '$148',
                bindings: {
                  textBinding: {
                    sourceType: 'variable',
                    targetId: 'cartTotal',
                    format: 'currency'
                  }
                },
                children: []
              }
            ]
          },
          {
            id: 'sc-actions',
            tag: 'div',
            name: 'Button Actions',
            classes: 'flex flex-wrap gap-3 mb-6',
            styles: {},
            attributes: {},
            content: '',
            bindings: {},
            children: [
              {
                id: 'sc-btn-add',
                tag: 'button',
                name: 'Add Item Button',
                classes: 'flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-lg font-medium text-sm transition cursor-pointer',
                styles: {},
                attributes: {},
                content: '+ Add Headphone ($89)',
                bindings: {
                  eventBindings: [
                    {
                      id: 'sc-evt-1',
                      eventName: 'click',
                      actionType: 'callFunction',
                      targetId: 'addSampleItem',
                      payloadExpr: "'Studio Headphone', 89"
                    }
                  ]
                },
                children: []
              },
              {
                id: 'sc-btn-clear',
                tag: 'button',
                name: 'Clear Cart Button',
                classes: 'py-2.5 px-4 bg-neutral-700 hover:bg-neutral-600 active:bg-neutral-800 text-neutral-300 rounded-lg font-medium text-sm transition cursor-pointer',
                styles: {},
                attributes: {},
                content: 'Empty Cart',
                bindings: {
                  eventBindings: [
                    {
                      id: 'sc-evt-2',
                      eventName: 'click',
                      actionType: 'callFunction',
                      targetId: 'clearCart'
                    }
                  ]
                },
                children: []
              }
            ]
          },
          {
            id: 'sc-coupon-form',
            tag: 'div',
            name: 'Coupon Form Container',
            classes: 'flex gap-2',
            styles: {},
            attributes: {},
            content: '',
            bindings: {},
            children: [
              {
                id: 'sc-coupon-input',
                tag: 'input',
                name: 'Coupon Input',
                classes: 'flex-1 bg-neutral-900 border border-neutral-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-amber-500 uppercase',
                styles: {},
                attributes: {
                  placeholder: 'Enter Coupon (SAVE20)'
                },
                content: '',
                bindings: {
                  attributeBindings: [
                    {
                      id: 'sc-bind-coupon',
                      attributeName: 'value',
                      sourceType: 'variable',
                      targetId: 'couponCode'
                    }
                  ],
                  eventBindings: [
                    {
                      id: 'sc-evt-input',
                      eventName: 'input',
                      actionType: 'setVariable',
                      targetId: 'couponCode',
                      payloadExpr: '$event.target.value'
                    }
                  ]
                },
                children: []
              },
              {
                id: 'sc-btn-coupon',
                tag: 'button',
                name: 'Apply Coupon Button',
                classes: 'px-5 py-2 bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white rounded-lg font-medium text-sm transition cursor-pointer',
                styles: {},
                attributes: {},
                content: 'Apply',
                bindings: {
                  eventBindings: [
                    {
                      id: 'sc-evt-3',
                      eventName: 'click',
                      actionType: 'callFunction',
                      targetId: 'applyCoupon'
                    }
                  ]
                },
                children: []
              }
            ]
          },
          {
            id: 'sc-discount-notice',
            tag: 'p',
            name: 'Discount Message Label',
            classes: 'text-xs text-neutral-400 mt-2',
            styles: {},
            attributes: {},
            content: 'Apply code SAVE20 for 20% off!',
            bindings: {
              textBinding: {
                sourceType: 'variable',
                targetId: 'discountMessage'
              }
            },
            children: []
          }
        ]
      }
    ]
  }
};

export const STARTER_PROJECTS: ProjectData[] = [
  MULTITHREADED_WORKER_PROJECT,
  SHOPPING_CART_PROJECT
];
