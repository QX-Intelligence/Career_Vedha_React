// vite.config.js
import { defineConfig } from "file:///C:/Users/chait/Desktop/Career%20Vedha/front/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/chait/Desktop/Career%20Vedha/front/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///C:/Users/chait/Desktop/Career%20Vedha/front/node_modules/vite-plugin-pwa/dist/index.js";
import obfuscator from "file:///C:/Users/chait/Desktop/Career%20Vedha/front/node_modules/rollup-plugin-javascript-obfuscator/dist/rollup-plugin-javascript-obfuscator.cjs.js";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    {
      ...obfuscator({
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 1,
        numbersToExpressions: true,
        simplify: true,
        stringArray: true,
        stringArrayThreshold: 1,
        splitStrings: true,
        splitStringsChunkLength: 5,
        unicodeEscapeSequence: true,
        // Disable selfDefending and debugProtection to avoid runtime errors or traps
        selfDefending: false,
        debugProtection: false,
        sourceMap: false
      }),
      apply: "build"
      // Only apply during production build
    }
  ],
  server: {
    port: 3e3,
    open: true
  },
  define: {
    global: "window"
  },
  build: {
    sourcemap: false
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJDOlxcXFxVc2Vyc1xcXFxjaGFpdFxcXFxEZXNrdG9wXFxcXENhcmVlciBWZWRoYVxcXFxmcm9udFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcY2hhaXRcXFxcRGVza3RvcFxcXFxDYXJlZXIgVmVkaGFcXFxcZnJvbnRcXFxcdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL0M6L1VzZXJzL2NoYWl0L0Rlc2t0b3AvQ2FyZWVyJTIwVmVkaGEvZnJvbnQvdml0ZS5jb25maWcuanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJ1xyXG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tICd2aXRlLXBsdWdpbi1wd2EnXHJcbmltcG9ydCBvYmZ1c2NhdG9yIGZyb20gJ3JvbGx1cC1wbHVnaW4tamF2YXNjcmlwdC1vYmZ1c2NhdG9yJ1xyXG5cclxuZXhwb3J0IGRlZmF1bHQgZGVmaW5lQ29uZmlnKHtcclxuICAgIHBsdWdpbnM6IFtcclxuICAgICAgICByZWFjdCgpLFxyXG4gICAgICAgIHtcclxuICAgICAgICAgICAgLi4ub2JmdXNjYXRvcih7XHJcbiAgICAgICAgICAgICAgICBjb21wYWN0OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgY29udHJvbEZsb3dGbGF0dGVuaW5nOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgY29udHJvbEZsb3dGbGF0dGVuaW5nVGhyZXNob2xkOiAxLFxyXG4gICAgICAgICAgICAgICAgbnVtYmVyc1RvRXhwcmVzc2lvbnM6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBzaW1wbGlmeTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHN0cmluZ0FycmF5OiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc3RyaW5nQXJyYXlUaHJlc2hvbGQ6IDEsXHJcbiAgICAgICAgICAgICAgICBzcGxpdFN0cmluZ3M6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBzcGxpdFN0cmluZ3NDaHVua0xlbmd0aDogNSxcclxuICAgICAgICAgICAgICAgIHVuaWNvZGVFc2NhcGVTZXF1ZW5jZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIC8vIERpc2FibGUgc2VsZkRlZmVuZGluZyBhbmQgZGVidWdQcm90ZWN0aW9uIHRvIGF2b2lkIHJ1bnRpbWUgZXJyb3JzIG9yIHRyYXBzXHJcbiAgICAgICAgICAgICAgICBzZWxmRGVmZW5kaW5nOiBmYWxzZSwgXHJcbiAgICAgICAgICAgICAgICBkZWJ1Z1Byb3RlY3Rpb246IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgc291cmNlTWFwOiBmYWxzZSxcclxuICAgICAgICAgICAgfSksXHJcbiAgICAgICAgICAgIGFwcGx5OiAnYnVpbGQnIC8vIE9ubHkgYXBwbHkgZHVyaW5nIHByb2R1Y3Rpb24gYnVpbGRcclxuICAgICAgICB9XHJcbiAgICBdLFxyXG4gICAgc2VydmVyOiB7XHJcbiAgICAgICAgcG9ydDogMzAwMCxcclxuICAgICAgICBvcGVuOiB0cnVlXHJcbiAgICB9LFxyXG4gICAgZGVmaW5lOiB7XHJcbiAgICAgICAgZ2xvYmFsOiAnd2luZG93JyxcclxuICAgIH0sXHJcbiAgICBidWlsZDoge1xyXG4gICAgICAgIHNvdXJjZW1hcDogZmFsc2UsXHJcbiAgICB9LFxyXG59KVxyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQTJULFNBQVMsb0JBQW9CO0FBQ3hWLE9BQU8sV0FBVztBQUNsQixTQUFTLGVBQWU7QUFDeEIsT0FBTyxnQkFBZ0I7QUFFdkIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDeEIsU0FBUztBQUFBLElBQ0wsTUFBTTtBQUFBLElBQ047QUFBQSxNQUNJLEdBQUcsV0FBVztBQUFBLFFBQ1YsU0FBUztBQUFBLFFBQ1QsdUJBQXVCO0FBQUEsUUFDdkIsZ0NBQWdDO0FBQUEsUUFDaEMsc0JBQXNCO0FBQUEsUUFDdEIsVUFBVTtBQUFBLFFBQ1YsYUFBYTtBQUFBLFFBQ2Isc0JBQXNCO0FBQUEsUUFDdEIsY0FBYztBQUFBLFFBQ2QseUJBQXlCO0FBQUEsUUFDekIsdUJBQXVCO0FBQUE7QUFBQSxRQUV2QixlQUFlO0FBQUEsUUFDZixpQkFBaUI7QUFBQSxRQUNqQixXQUFXO0FBQUEsTUFDZixDQUFDO0FBQUEsTUFDRCxPQUFPO0FBQUE7QUFBQSxJQUNYO0FBQUEsRUFDSjtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ0osTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNKLFFBQVE7QUFBQSxFQUNaO0FBQUEsRUFDQSxPQUFPO0FBQUEsSUFDSCxXQUFXO0FBQUEsRUFDZjtBQUNKLENBQUM7IiwKICAibmFtZXMiOiBbXQp9Cg==
