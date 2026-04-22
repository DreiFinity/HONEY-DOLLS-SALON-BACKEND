// src/application/usecases/Branch/GetAllBranches.js
export default class GetAllBranches {
  constructor(branchRepo) {
    this.branchRepo = branchRepo;
  }

  async execute() {
    return await this.branchRepo.getAllBranches();
  }
}
