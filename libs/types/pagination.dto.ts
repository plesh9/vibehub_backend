export class PaginationDto {
    page: number;
    limit: number;

    constructor(dto: { page: number; limit: number }) {
        this.page = +dto.page || 1;
        this.limit = +dto.limit || 52;
    }
}
