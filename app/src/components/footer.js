import React from 'react';
import useStyles from './material-ui-styles.js';
import Box from '@material-ui/core/Box';
import Container from '@material-ui/core/Container';

function Footer() {

  const classes = useStyles();


  return (
    <Container className={classes.footer}>
       <Box>
          These works are solely my own and not those of my employer.
          <br />
          Copyright © Mat Werber
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