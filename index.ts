import { registerRootComponent } from 'expo';

import App from './App';

// registerRootComponent 會呼叫 AppRegistry.registerComponent('main', () => App);
// 它也確保無論是透過 Expo 還是原生環境載入應用程式，環境都已正確設置
registerRootComponent(App);