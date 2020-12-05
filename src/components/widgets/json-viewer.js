import React from 'react';
import ReactJson from 'react-json-view';
import { view } from '@risingstack/react-easy-state';

// Nifty tool for nice visualization of json objects:
const JsonViewer = view(({ jsonObject, collapseStringsAfterLength, collapsed }) => {

  const customStyle = {
    'textAlign': 'left',
  };

  return (
    <ReactJson
      theme='rjv-default'
      collapseStringsAfterLength={collapseStringsAfterLength || 50 }
      collapsed={collapsed || 2}
      style={customStyle}
      src={jsonObject}
      displayDataTypes={false}
      />
  );

});

export default JsonViewer; 