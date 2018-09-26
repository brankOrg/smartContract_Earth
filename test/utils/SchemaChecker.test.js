const SchemaChecker = require('../../lib/utils/SchemaChecker');
const chai = require('chai');

chai.should();

describe('Test SchemaChecker', () => {
  it('Missing required property should throw error', () => {
    const schema = [
      { name: 'name', type: 'string', required: true },
    ];

    try {
      SchemaChecker.check(schema, {
        id: '123',
      });
    } catch (e) {
      e.message.should.eql('Missing Required property name');
    }
  });

  it('Required property with wrong type should throw error', () => {
    const schema = [
      { name: 'name', type: 'string', required: true },
    ];

    try {
      SchemaChecker.check(schema, {
        name: 123,
      });
    } catch (e) {
      e.message.should.eql('123 is not of type string');
    }
  });

  it('Success', () => {
    const schema = [
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'string', required: false },
    ];
    SchemaChecker.check(schema, {
      name: '',
    });
  });
});
