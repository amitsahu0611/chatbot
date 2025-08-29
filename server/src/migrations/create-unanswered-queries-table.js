require('dotenv').config({ path: './config.env' });
const { Sequelize } = require('sequelize');
const { sequelize } = require('../config/database');

async function createUnansweredQueriesTable() {
  try {
    console.log('🗃️ Creating unanswered_queries table...');

    await sequelize.getQueryInterface().createTable('unanswered_queries', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      companyId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        field: 'company_id',
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      query: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'The user question that could not be answered'
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true,
        field: 'ip_address',
        comment: 'IP address of the user who asked the question'
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'user_agent',
        comment: 'Browser user agent of the user'
      },
      sessionId: {
        type: Sequelize.STRING(255),
        allowNull: true,
        field: 'session_id',
        comment: 'Chat session ID'
      },
      frequency: {
        type: Sequelize.INTEGER,
        defaultValue: 1,
        allowNull: false,
        comment: 'How many times this question has been asked'
      },
      status: {
        type: Sequelize.ENUM('pending', 'answered', 'ignored'),
        defaultValue: 'pending',
        allowNull: false,
        comment: 'Status of the unanswered query'
      },
      priority: {
        type: Sequelize.ENUM('low', 'medium', 'high'),
        defaultValue: 'medium',
        allowNull: false,
        comment: 'Priority level based on frequency and importance'
      },
      lastAsked: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'last_asked',
        defaultValue: Sequelize.NOW,
        comment: 'When this question was last asked'
      },
      relatedFaqId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        field: 'related_faq_id',
        references: {
          model: 'faqs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: 'FAQ created to answer this question'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Admin notes about this query'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'created_at',
        defaultValue: Sequelize.NOW
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updated_at',
        defaultValue: Sequelize.NOW
      }
    });

    // Create indexes for better performance
    await sequelize.getQueryInterface().addIndex('unanswered_queries', ['company_id'], {
      name: 'idx_unanswered_queries_company_id'
    });

    await sequelize.getQueryInterface().addIndex('unanswered_queries', ['status'], {
      name: 'idx_unanswered_queries_status'
    });

    await sequelize.getQueryInterface().addIndex('unanswered_queries', ['frequency'], {
      name: 'idx_unanswered_queries_frequency'
    });

    await sequelize.getQueryInterface().addIndex('unanswered_queries', ['last_asked'], {
      name: 'idx_unanswered_queries_last_asked'
    });

    // Add fulltext index for query search
    await sequelize.query('ALTER TABLE unanswered_queries ADD FULLTEXT(query)');

    console.log('✅ unanswered_queries table created successfully');
    console.log('✅ Indexes created successfully');
    
  } catch (error) {
    console.error('❌ Error creating unanswered_queries table:', error);
    throw error;
  }
}

// Run the migration
if (require.main === module) {
  createUnansweredQueriesTable()
    .then(() => {
      console.log('🎉 Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

module.exports = createUnansweredQueriesTable;
