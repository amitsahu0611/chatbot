const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if visitor_sessions table exists
      const tables = await queryInterface.showAllTables();
      const tableExists = tables.includes('visitor_sessions');

      if (!tableExists) {
        // Create the entire table if it doesn't exist
        await queryInterface.createTable('visitor_sessions', {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
          },
          ipAddress: {
            type: DataTypes.STRING(45), // Supports both IPv4 and IPv6
            allowNull: false
          },
          companyId: {
            type: DataTypes.INTEGER,
            allowNull: false
          },
          sessionToken: {
            type: DataTypes.STRING(255),
            allowNull: false,
            unique: true
          },
          visitorName: {
            type: DataTypes.STRING(100),
            allowNull: true
          },
          visitorEmail: {
            type: DataTypes.STRING(255),
            allowNull: true
          },
          visitorPhone: {
            type: DataTypes.STRING(20),
            allowNull: true
          },
          topic: {
            type: DataTypes.STRING(255),
            allowNull: true
          },
          userAgent: {
            type: DataTypes.TEXT,
            allowNull: true
          },
          country: {
            type: DataTypes.STRING(100),
            allowNull: true
          },
          city: {
            type: DataTypes.STRING(100),
            allowNull: true
          },
          firstVisit: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          lastActivity: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          expiresAt: {
            type: DataTypes.DATE,
            allowNull: false
          },
          isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
          },
          messageCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          leadCreated: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
          },
          metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: '{}'
          },
          createdAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          updatedAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
          }
        });

        // Add indexes
        await queryInterface.addIndex('visitor_sessions', ['ipAddress', 'companyId']);
        await queryInterface.addIndex('visitor_sessions', ['expiresAt']);
        await queryInterface.addIndex('visitor_sessions', ['isActive']);
        await queryInterface.addIndex('visitor_sessions', ['sessionToken']);

        console.log('✅ Created visitor_sessions table with all columns and indexes');
      } else {
        // Table exists, check if ipAddress column exists
        const tableDescription = await queryInterface.describeTable('visitor_sessions');
        
        if (!tableDescription.ipAddress) {
          // Add missing ipAddress column
          await queryInterface.addColumn('visitor_sessions', 'ipAddress', {
            type: DataTypes.STRING(45),
            allowNull: false,
            defaultValue: '127.0.0.1' // Temporary default
          });

          // Add index for ipAddress
          await queryInterface.addIndex('visitor_sessions', ['ipAddress', 'companyId']);
          
          console.log('✅ Added missing ipAddress column to visitor_sessions table');
        }

        // Check and add other missing columns if needed
        const requiredColumns = {
          companyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 1
          },
          sessionToken: {
            type: DataTypes.STRING(255),
            allowNull: false,
            defaultValue: 'temp_token'
          },
          visitorName: {
            type: DataTypes.STRING(100),
            allowNull: true
          },
          visitorEmail: {
            type: DataTypes.STRING(255),
            allowNull: true
          },
          visitorPhone: {
            type: DataTypes.STRING(20),
            allowNull: true
          },
          topic: {
            type: DataTypes.STRING(255),
            allowNull: true
          },
          userAgent: {
            type: DataTypes.TEXT,
            allowNull: true
          },
          country: {
            type: DataTypes.STRING(100),
            allowNull: true
          },
          city: {
            type: DataTypes.STRING(100),
            allowNull: true
          },
          firstVisit: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          lastActivity: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
          },
          expiresAt: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: Sequelize.literal('DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 2 HOUR)')
          },
          isActive: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: true
          },
          messageCount: {
            type: DataTypes.INTEGER,
            allowNull: false,
            defaultValue: 0
          },
          leadCreated: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
          },
          metadata: {
            type: DataTypes.JSON,
            allowNull: true,
            defaultValue: '{}'
          }
        };

        for (const [columnName, columnDefinition] of Object.entries(requiredColumns)) {
          if (!tableDescription[columnName]) {
            await queryInterface.addColumn('visitor_sessions', columnName, columnDefinition);
            console.log(`✅ Added missing column: ${columnName}`);
          }
        }
      }

      console.log('✅ VisitorSession table migration completed successfully');
    } catch (error) {
      console.error('❌ Error in VisitorSession migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.dropTable('visitor_sessions');
      console.log('✅ Dropped visitor_sessions table');
    } catch (error) {
      console.error('❌ Error dropping visitor_sessions table:', error);
      throw error;
    }
  }
};
