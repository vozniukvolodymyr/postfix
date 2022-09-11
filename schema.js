'use strict';
const Sequelize = require('sequelize');

class Mysqlcontainer {
  constructor(sequelize) {
    this.sequelize = sequelize;
    this.Client = sequelize.define('client', {
      ID: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      EMAIL: {
        type: Sequelize.STRING,
        allowNull: false,
      }
    });
    this.Inmail = sequelize.define("inmail", {
      ID: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },      
      DATECREATE: {
        type: Sequelize.DATE,
        allowNull: true,
        noUpdate: true
      },      
      DATEUPDATE: {
        type: Sequelize.DATE,
        allowNull: true,
        noUpdate: true
      },
      EMAIL: {
        type: Sequelize.STRING,
        allowNull: false 
      },              
      STATUS: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      CLIENTFROM_ID: {
        type: Sequelize.INTEGER,
        allowNull: false
      },        
      SUBJECT: {
        type: Sequelize.STRING,
        allowNull: true 
      },
      IDEMPOTENCYKEY: {
        type: Sequelize.STRING,
        allowNull: false 
      },
      CONTENT: {
        type: Sequelize.STRING,
        allowNull: true 
      },    
      COMMENT: {
        type: Sequelize.STRING,
        allowNull: true 
      }    
    });

    this.Outmail = sequelize.define("outmail", {
      ID: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },      
      DATECREATE: {
        type: Sequelize.DATE,
        allowNull: true,
        noUpdate: true
      },      
      DATEUPDATE: {
        type: Sequelize.DATE,
        allowNull: true,
        noUpdate: true
      },
      EMAIL: {
        type: Sequelize.STRING,
        allowNull: true 
      },              
      STATUS: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      CLIENTTO_ID: {
        type: Sequelize.INTEGER,
        allowNull: false
      },        
      SUBJECT: {
        type: Sequelize.STRING,
        allowNull: true 
      },
      CONTENT: {
        type: Sequelize.STRING,
        allowNull: true 
      },    
      COMMENT: {
        type: Sequelize.STRING,
        allowNull: true 
      },   
      LANGUAGE: {
        type: Sequelize.STRING,
        allowNull: true 
      }   
    });

    this.Inmail.belongsTo(this.Client,
      { as: 'clientfrom',
        foreignKey: "CLIENTFROM_ID" }
      );    

    this.Outmail.belongsTo(this.Client,
      { as: 'clientto',
        foreignKey: "CLIENTTO_ID" }
      );
  }
}

module.exports = { Mysqlcontainer };
