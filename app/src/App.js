import React from 'react';
import './App.css';
import Header from './components/header';
import Body from './components/body';
import Footer from './components/footer';
import { view } from '@risingstack/react-easy-state';

function App() {

  return (
    <div className="App">
      <Header />
      <Body />
      <Footer />
    </div>
  );
}

export default view(App);