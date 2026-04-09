export class ReviewController {
    reviewService;
    constructor(reviewService) {
        this.reviewService = reviewService;
    }
    getEventReviews = async (req, res) => {
        const eventId = Number(req.params.eventId);
        const result = await this.reviewService.getEventReviews(eventId);
        res.status(200).send(result);
    };
    createReview = async (req, res) => {
        if (!req.user) {
            return res.status(401).send({ message: "Unauthorized" });
        }
        const eventId = Number(req.params.eventId);
        const result = await this.reviewService.createReview(req.user.id, eventId, req.body);
        res.status(201).send(result);
    };
    getOrganizerProfile = async (req, res) => {
        const organizerId = Number(req.params.organizerId);
        const result = await this.reviewService.getOrganizerProfile(organizerId);
        res.status(200).send(result);
    };
}
