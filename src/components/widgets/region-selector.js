import React from 'react';
import { view } from '@risingstack/react-easy-state';

import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';

const RegionSelector = view(({ value, setFunction }) => {

  const regions = [
    "ap-south-1",
    "ap-northeast-1",
    "ap-northeast-2",
    "ap-northeast-3",
    "ap-southeast-1",
    "ap-southeast-2",
    "eu-north-1",
    "eu-west-1",
    "eu-west-2",
    "eu-west-3",
    "eu-central-1",
    "us-west-1",
    "us-west-2",
    "us-east-1",
    "us-east-2",
    "us-central-1",
    "sa-east-1",
    "ca-central-1",
  ];


  const menuItems = regions.map((region) => 
    <MenuItem key={region} value={region}>{region}</MenuItem>
  );

  function onChangeHandler(event) {
    setFunction(event.target.value);
  }

  return (
    <Select
    value={value}
    onChange={onChangeHandler}
  >
    {menuItems}
  </Select>
  );

});

export default RegionSelector; 