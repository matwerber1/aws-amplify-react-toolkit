import React from 'react';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';
import useStyles from './common/material-ui-styles.js';

function Footer() {

  const classes = useStyles();

  return (
    <Container className={classes.footer}>
       <Box>
          this is a footer
      </Box>
    </Container>
   
  );

   /*

  return (
    <div className={classes.appBarFooter}>
        These works are solely my own and not necessarily those of my employer.
         <br />
         Copyright © Mat Werber
    </div>
  );
  */
 
}

export default Footer; 