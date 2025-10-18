import React, { useState, useEffect } from 'react';
import { Gamepad2, Smartphone, AlertCircle } from 'lucide-react';

/**
 * AR Game Launcher Component
 * Provides an entry point to the TBTC AR Cleanup Game
 */
const ARGameLauncher = () => {
  const [isARSupported, setIsARSupported] = useState(null);
  const [showInfo, setShowInfo] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({ isIOS: false, isSafari: false, isAndroid: false });

  useEffect(() => {
    // Detect device and browser
    const detectDevice = () => {
      const ua = navigator.userAgent;
      const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
      const isSafari = /^((?!chrome|android).)*safari/i.test(ua);
      const isAndroid = /android/i.test(ua);

      setDeviceInfo({ isIOS, isSafari, isAndroid });

      console.log('Device Detection:', { isIOS, isSafari, isAndroid, userAgent: ua });
    };

    // Check if WebXR AR is supported
    const checkARSupport = async () => {
      detectDevice();

      if ('xr' in navigator) {
        try {
          const supported = await navigator.xr.isSessionSupported('immersive-ar');
          console.log('WebXR AR Support:', supported);
          setIsARSupported(supported);
        } catch (error) {
          console.error('Error checking AR support:', error);
          setIsARSupported(false);
        }
      } else {
        console.log('navigator.xr not available');
        setIsARSupported(false);
      }
    };

    checkARSupport();
  }, []);

  const launchARGame = () => {
    // Open AR game in new window/tab
    window.open('/ar-cleanup-game.html', '_blank');
  };

  return (
    <div className="ar-game-launcher">
      <style>{`
        .ar-game-launcher {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          padding: 24px;
          color: white;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
          margin: 20px 0;
        }

        .ar-game-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .ar-game-icon {
          background: rgba(255, 255, 255, 0.2);
          padding: 12px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .ar-game-title {
          font-size: 24px;
          font-weight: bold;
          margin: 0;
        }

        .ar-game-description {
          font-size: 16px;
          line-height: 1.6;
          margin-bottom: 20px;
          opacity: 0.95;
        }

        .ar-game-features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 12px;
          margin-bottom: 20px;
        }

        .ar-feature {
          background: rgba(255, 255, 255, 0.1);
          padding: 12px;
          border-radius: 8px;
          font-size: 14px;
        }

        .ar-feature strong {
          display: block;
          margin-bottom: 4px;
        }

        .ar-game-actions {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .ar-launch-button {
          background: white;
          color: #667eea;
          border: none;
          padding: 14px 28px;
          font-size: 16px;
          font-weight: bold;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .ar-launch-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
        }

        .ar-launch-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .ar-info-button {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: 2px solid white;
          padding: 12px 24px;
          font-size: 14px;
          font-weight: 600;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .ar-info-button:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .ar-support-warning {
          background: rgba(255, 193, 7, 0.2);
          border: 2px solid #FFC107;
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
          display: flex;
          gap: 12px;
          align-items: start;
        }

        .ar-support-warning-icon {
          flex-shrink: 0;
          color: #FFC107;
        }

        .ar-support-warning-text {
          font-size: 14px;
          line-height: 1.5;
        }

        .ar-info-modal {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(10px);
          border-radius: 8px;
          padding: 20px;
          margin-top: 16px;
          border: 1px solid rgba(255, 255, 255, 0.3);
        }

        .ar-info-modal h3 {
          margin-top: 0;
          margin-bottom: 12px;
          font-size: 18px;
        }

        .ar-info-modal ul {
          margin: 8px 0;
          padding-left: 20px;
        }

        .ar-info-modal li {
          margin: 6px 0;
          font-size: 14px;
        }

        .ar-close-info {
          background: rgba(255, 255, 255, 0.2);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          margin-top: 12px;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .ar-game-launcher {
            padding: 16px;
          }

          .ar-game-title {
            font-size: 20px;
          }

          .ar-game-features {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="ar-game-header">
        <div className="ar-game-icon">
          <Gamepad2 size={32} />
        </div>
        <h2 className="ar-game-title">🧹 AR Cleanup Game</h2>
      </div>

      <p className="ar-game-description">
        Experience parking lot cleanup in augmented reality! Place a virtual trash bin in your space 
        and practice your aim by throwing trash into it. A fun, gamified way to celebrate our cleanup efforts!
      </p>

      <div className="ar-game-features">
        <div className="ar-feature">
          <strong>📱 Mobile AR</strong>
          Works on AR-capable smartphones
        </div>
        <div className="ar-feature">
          <strong>🎯 Interactive</strong>
          Swipe to throw, tap to place
        </div>
        <div className="ar-feature">
          <strong>🏆 Score Tracking</strong>
          Compete for the highest score
        </div>
      </div>

      <div className="ar-game-actions">
        <button
          className="ar-launch-button"
          onClick={launchARGame}
          disabled={isARSupported === false}
        >
          <Smartphone size={20} />
          {isARSupported === null ? 'Checking AR Support...' : 
           isARSupported ? 'Launch AR Game' : 'AR Not Available'}
        </button>

        <button
          className="ar-info-button"
          onClick={() => setShowInfo(!showInfo)}
        >
          {showInfo ? 'Hide Info' : 'How to Play'}
        </button>
      </div>

      {isARSupported === false && (
        <div className="ar-support-warning">
          <AlertCircle className="ar-support-warning-icon" size={24} />
          <div className="ar-support-warning-text">
            <strong>
              {deviceInfo.isIOS ? '⚠️ iOS Safari Limitation' : 'AR Not Supported'}
            </strong>
            <p style={{ margin: '4px 0 0 0' }}>
              {deviceInfo.isIOS ? (
                <>
                  Safari on iOS does not support WebXR AR. To test the AR game on iPhone:
                  <br />
                  <strong>Option 1:</strong> Download the free "WebXR Viewer" app from the App Store
                  <br />
                  <strong>Option 2:</strong> Test on an Android device with Chrome
                  <br />
                  <a
                    href="https://apps.apple.com/us/app/webxr-viewer/id1295998056"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#FFC107', textDecoration: 'underline', marginTop: '8px', display: 'inline-block' }}
                  >
                    Download WebXR Viewer →
                  </a>
                </>
              ) : (
                <>
                  This device doesn't support WebXR AR. Please use Chrome or Edge on an
                  AR-capable Android device (Android 8.0+).
                </>
              )}
            </p>
          </div>
        </div>
      )}

      {showInfo && (
        <div className="ar-info-modal">
          <h3>How to Play</h3>
          <ol>
            <li>Click "Launch AR Game" to open the game in a new tab</li>
            <li>Grant camera permissions when prompted</li>
            <li>Point your camera at a flat surface (floor, table, etc.)</li>
            <li>Tap the screen to place the trash bin</li>
            <li>Swipe on the screen to throw trash balls</li>
            <li>Try to get the trash into the bin to score points!</li>
          </ol>

          <h3>Device Compatibility</h3>
          <ul>
            <li><strong>✅ Android:</strong> Chrome or Edge browser (Android 8.0+)</li>
            <li><strong>⚠️ iOS:</strong> Requires WebXR Viewer app (Safari not supported)</li>
            <li><strong>📱 Requirements:</strong> Camera permissions, good lighting</li>
          </ul>

          {deviceInfo.isIOS && (
            <div style={{
              background: 'rgba(255, 193, 7, 0.2)',
              padding: '12px',
              borderRadius: '6px',
              marginTop: '12px',
              fontSize: '13px'
            }}>
              <strong>📱 iOS Users:</strong> Safari doesn't support WebXR AR.
              Download the free "WebXR Viewer" app to test AR features on your iPhone.
            </div>
          )}

          <button className="ar-close-info" onClick={() => setShowInfo(false)}>
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default ARGameLauncher;

