const api = require('../config/axios')

/**
 *
 * @param {string|number} buffer
 * @param {number} now
 */
async function getOrgsLegisErp (token) {
  const { data: orgs } = await api.axios.get(
    'legis/resources/legis_erp',
    {
      params: {
        limit: 9000,
        where: {
          syncByLegisErpTemplate: 1
        }
      },
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  )
  const orgSlugs = orgs.map(org => org.orgSlug)
  return orgSlugs
}

module.exports = {
  getOrgsLegisErp

}
