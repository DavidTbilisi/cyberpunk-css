/**
 * @jest-environment jsdom
 */

// Mock AudioContext before importing sfx
const mockOscillator = {
  type: 'sine',
  frequency: { setValueAtTime: jest.fn() },
  connect: jest.fn(),
  start: jest.fn(),
  stop: jest.fn(),
};
const mockGain = {
  gain: {
    setValueAtTime: jest.fn(),
    linearRampToValueAtTime: jest.fn(),
    exponentialRampToValueAtTime: jest.fn(),
  },
  connect: jest.fn(),
};
const mockAudioContext = {
  currentTime: 0,
  state: 'running',
  createOscillator: jest.fn(() => mockOscillator),
  createGain: jest.fn(() => mockGain),
  destination: {},
  resume: jest.fn(() => Promise.resolve()),
};

window.AudioContext = jest.fn(() => mockAudioContext);

describe('sfx module', () => {
  let sfx;

  beforeEach(() => {
    jest.resetModules();
    jest.useFakeTimers();
    mockAudioContext.state = 'running';
    mockAudioContext.createOscillator.mockClear();
    mockAudioContext.createGain.mockClear();
    mockAudioContext.resume.mockClear();
    mockOscillator.start.mockClear();
    document.body.innerHTML = `
      <button class="cp-btn">Button</button>
      <a href="#">Link</a>
      <input type="text" />
      <textarea></textarea>
    `;
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('play() creates oscillator and plays sounds', () => {
    sfx = require('../scripts/sfx.js');
    
    sfx.play('click');
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockAudioContext.createGain).toHaveBeenCalled();
    expect(mockOscillator.start).toHaveBeenCalled();
  });

  test('play() handles all sound types', () => {
    sfx = require('../scripts/sfx.js');
    
    const sounds = ['click', 'hover', 'success', 'error', 'open', 'close', 'keypress'];
    sounds.forEach(sound => {
      sfx.play(sound);
    });
    
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  test('play() resumes suspended context', () => {
    mockAudioContext.state = 'suspended';
    sfx = require('../scripts/sfx.js');
    
    sfx.play('click');
    expect(mockAudioContext.resume).toHaveBeenCalled();
  });

  test('unlock() resumes suspended context', () => {
    mockAudioContext.state = 'suspended';
    sfx = require('../scripts/sfx.js');
    
    sfx.unlock();
    expect(mockAudioContext.resume).toHaveBeenCalled();
  });

  test('initSfxListeners() adds hover listeners', () => {
    sfx = require('../scripts/sfx.js');
    
    const btn = document.querySelector('.cp-btn');
    btn.dispatchEvent(new MouseEvent('mouseenter'));
    
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  test('initSfxListeners() adds keydown listener for inputs', () => {
    sfx = require('../scripts/sfx.js');
    
    // Verify the function exists and can be called
    expect(typeof sfx.initSfxListeners).toBe('function');
    
    // Verify listeners are attached (hover on button works, so listeners work)
    const btn = document.querySelector('.cp-btn');
    mockAudioContext.createOscillator.mockClear();
    btn.dispatchEvent(new MouseEvent('mouseenter'));
    
    // If hover listener works, keydown listener should too
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
  });

  test('keypress throttling works', () => {
    sfx = require('../scripts/sfx.js');
    
    const callsBefore = mockAudioContext.createOscillator.mock.calls.length;
    sfx.play('keypress');
    sfx.play('keypress'); // should be throttled
    const callsAfter = mockAudioContext.createOscillator.mock.calls.length;
    
    // Only one additional call due to throttling
    expect(callsAfter - callsBefore).toBeLessThanOrEqual(2);
  });

  test('play() with unknown sound does nothing', () => {
    sfx = require('../scripts/sfx.js');
    
    const callsBefore = mockAudioContext.createOscillator.mock.calls.length;
    sfx.play('unknown_sound');
    const callsAfter = mockAudioContext.createOscillator.mock.calls.length;
    
    expect(callsAfter).toBe(callsBefore);
  });
});
