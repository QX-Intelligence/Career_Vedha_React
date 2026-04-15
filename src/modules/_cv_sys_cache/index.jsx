import React, { Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { lazyWithRetry } from '../../utils/lazyLoading';
import { CacheProvider } from './context/Cache_Context';
import DomainGuard from '../../components/utils/DomainGuard';
import UI_Nav from './components/UI_Nav';
import UI_Base from './components/UI_Base';
import './Module_Styles.css';
import '../../styles/store.css'; // Global E-store responsive styles

// Renamed core modules
const Module_Entry = lazyWithRetry(() => import('./pages/Module_Entry'));
const Module_List = lazyWithRetry(() => import('./pages/Module_List'));
const Module_View = lazyWithRetry(() => import('./pages/Module_View'));
const Module_Queue = lazyWithRetry(() => import('./pages/Module_Queue'));
const Module_Process = lazyWithRetry(() => import('./pages/Module_Process'));
const Module_Info = lazyWithRetry(() => import('./pages/Module_Info'));
const Module_Orders = lazyWithRetry(() => import('./pages/Module_Orders'));
const Module_Login = lazyWithRetry(() => import('./pages/Module_Login'));
const Module_Register = lazyWithRetry(() => import('./pages/Module_Register'));
const Module_OrderDetail = lazyWithRetry(() => import('./pages/Module_OrderDetail'));
const Module_Library = lazyWithRetry(() => import('./pages/Module_Library'));
const Module_ServiceDetail = lazyWithRetry(() => import('./pages/Module_ServiceDetail'));

const CV_Store_Module = () => {
  return (
    <DomainGuard>
      <CacheProvider>
        <div className="CV_Store_Root" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: '#FDFBF7' }}>
          <UI_Nav />
          <main style={{ flexGrow: 1 }}>
            <Suspense fallback={<div style={{ padding: '10rem', textAlign: 'center', color: '#94A3B8' }}>Loading Secure Module...</div>}>
              <Routes>
                <Route path="/" element={<Module_Entry />} />
                <Route path="/shop" element={<Module_List />} />
                <Route path="/view/:id" element={<Module_View />} />
                <Route path="/queue" element={<Module_Queue />} />
                <Route path="/process" element={<Module_Process />} />
                <Route path="/orders" element={<Module_Orders />} />
                <Route path="/orders/:id" element={<Module_OrderDetail />} />
                <Route path="/library" element={<Module_Library />} />
                <Route path="/about" element={<Module_Info />} />
                <Route path="/service/:id" element={<Module_ServiceDetail />} />
                <Route path="/login" element={<Module_Login />} />
                <Route path="/register" element={<Module_Register />} />
              </Routes>
            </Suspense>
          </main>
          <UI_Base />
        </div>
      </CacheProvider>
    </DomainGuard>
  );
};

export default CV_Store_Module;
