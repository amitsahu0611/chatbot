const { DataTypes } = require('sequelize');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    try {
      // Check if leads table exists
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('leads')) {
        console.log('❌ Leads table does not exist! Creating it...');
        
        // Create the leads table with all required columns
        await queryInterface.createTable('leads', {
          id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
          },
          companyId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
              model: 'companies',
              key: 'id'
            }
          },
          visitorId: {
            type: DataTypes.STRING,
            allowNull: false
          },
          email: {
            type: DataTypes.STRING,
            allowNull: true
          },
          name: {
            type: DataTypes.STRING,
            allowNull: true
          },
          phone: {
            type: DataTypes.STRING,
            allowNull: true
          },
          ipAddress: {
            type: DataTypes.STRING,
            allowNull: true
          },
          country: {
            type: DataTypes.STRING,
            allowNull: true
          },
          city: {
            type: DataTypes.STRING,
            allowNull: true
          },
          region: {
            type: DataTypes.STRING,
            allowNull: true
          },
          timezone: {
            type: DataTypes.STRING,
            allowNull: true
          },
          userAgent: {
            type: DataTypes.TEXT,
            allowNull: true
          },
          browser: {
            type: DataTypes.STRING,
            allowNull: true
          },
          browserVersion: {
            type: DataTypes.STRING,
            allowNull: true
          },
          os: {
            type: DataTypes.STRING,
            allowNull: true
          },
          osVersion: {
            type: DataTypes.STRING,
            allowNull: true
          },
          device: {
            type: DataTypes.STRING,
            allowNull: true
          },
          screenResolution: {
            type: DataTypes.STRING,
            allowNull: true
          },
          sessionId: {
            type: DataTypes.STRING,
            allowNull: true
          },
          firstVisit: {
            type: DataTypes.DATE,
            allowNull: true
          },
          lastVisit: {
            type: DataTypes.DATE,
            allowNull: true
          },
          visitCount: {
            type: DataTypes.INTEGER,
            defaultValue: 1
          },
          totalTimeOnSite: {
            type: DataTypes.INTEGER,
            defaultValue: 0
          },
          currentPage: {
            type: DataTypes.STRING,
            allowNull: true
          },
          referrer: {
            type: DataTypes.STRING,
            allowNull: true
          },
          utmSource: {
            type: DataTypes.STRING,
            allowNull: true
          },
          utmMedium: {
            type: DataTypes.STRING,
            allowNull: true
          },
          utmCampaign: {
            type: DataTypes.STRING,
            allowNull: true
          },
          utmTerm: {
            type: DataTypes.STRING,
            allowNull: true
          },
          utmContent: {
            type: DataTypes.STRING,
            allowNull: true
          },
          status: {
            type: DataTypes.ENUM('new', 'contacted', 'qualified', 'converted', 'lost'),
            defaultValue: 'new'
          },
          score: {
            type: DataTypes.INTEGER,
            defaultValue: 0
          },
          priority: {
            type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
            defaultValue: 'medium'
          },
          interactions: {
            type: DataTypes.JSON,
            defaultValue: []
          },
          customFields: {
            type: DataTypes.JSON,
            defaultValue: {}
          },
          notes: {
            type: DataTypes.TEXT,
            allowNull: true
          },
          tags: {
            type: DataTypes.JSON,
            defaultValue: []
          },
          assignedTo: {
            type: DataTypes.INTEGER,
            allowNull: true,
            references: {
              model: 'users',
              key: 'id'
            }
          },
          lastActivity: {
            type: DataTypes.DATE,
            allowNull: true
          },
          source: {
            type: DataTypes.STRING,
            allowNull: true
          },
          convertedAt: {
            type: DataTypes.DATE,
            allowNull: true
          },
          conversionValue: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
          },
          conversionCurrency: {
            type: DataTypes.STRING,
            allowNull: true
          },
          pagesViewed: {
            type: DataTypes.INTEGER,
            defaultValue: 0
          },
          formsSubmitted: {
            type: DataTypes.INTEGER,
            defaultValue: 0
          },
          emailsOpened: {
            type: DataTypes.INTEGER,
            defaultValue: 0
          },
          emailsClicked: {
            type: DataTypes.INTEGER,
            defaultValue: 0
          },
          hasChatted: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
          },
          chatCount: {
            type: DataTypes.INTEGER,
            defaultValue: 0
          },
          lastChatAt: {
            type: DataTypes.DATE,
            allowNull: true
          },
          socialProfiles: {
            type: DataTypes.JSON,
            defaultValue: {}
          },
          company: {
            type: DataTypes.STRING,
            allowNull: true
          },
          jobTitle: {
            type: DataTypes.STRING,
            allowNull: true
          },
          industry: {
            type: DataTypes.STRING,
            allowNull: true
          },
          companySize: {
            type: DataTypes.STRING,
            allowNull: true
          },
          preferences: {
            type: DataTypes.JSON,
            defaultValue: {
              emailOptIn: false,
              smsOptIn: false,
              marketingOptIn: false,
              preferredContactMethod: 'email',
              preferredContactTime: 'business_hours'
            }
          },
          gdprConsent: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
          },
          gdprConsentDate: {
            type: DataTypes.DATE,
            allowNull: true
          },
          metadata: {
            type: DataTypes.JSON,
            defaultValue: {}
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
        
        console.log('✅ Created leads table with all required columns');
        return;
      }
      
      // Check if visitorId column exists
      const table = await queryInterface.describeTable('leads');
      
      if (!table.visitorId) {
        await queryInterface.addColumn('leads', 'visitorId', {
          type: DataTypes.STRING,
          allowNull: false,
          defaultValue: 'temp_visitor_id' // Temporary default for existing records
        });
        
        console.log('✅ Added visitorId column to leads table');
        
        // Update existing records with a temporary visitor ID
        await queryInterface.sequelize.query(`
          UPDATE leads 
          SET visitorId = CONCAT('existing_', id, '_', UNIX_TIMESTAMP()) 
          WHERE visitorId = 'temp_visitor_id'
        `);
        
        console.log('✅ Updated existing leads with visitor IDs');
      } else {
        console.log('✅ visitorId column already exists in leads table');
      }
    } catch (error) {
      console.error('❌ Error in leads migration:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    try {
      await queryInterface.removeColumn('leads', 'visitorId');
      console.log('✅ Removed visitorId column from leads table');
    } catch (error) {
      console.error('❌ Error removing visitorId column:', error);
      throw error;
    }
  }
};
