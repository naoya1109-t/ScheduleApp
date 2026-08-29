import type { CustomerMasterEntry, CustomerMasterRepository } from "../../modules/incidentReports/types.js"

export class FakeCustomerMasterRepository implements CustomerMasterRepository {
  entries: CustomerMasterEntry[] = []

  async search(query: string): Promise<CustomerMasterEntry[]> {
    return this.entries.filter(
      (entry) => entry.customerCode.includes(query) || entry.customerName.includes(query),
    )
  }

  async findByCode(customerCode: string): Promise<CustomerMasterEntry | undefined> {
    return this.entries.find((entry) => entry.customerCode === customerCode)
  }
}
